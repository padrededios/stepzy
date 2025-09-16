import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateEmail, verifyPassword } from '@/lib/auth/validators';
import { getRedirectUrl, sanitizeUserData } from '@/lib/auth/utils';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Rate limiting pour les tentatives de connexion
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return ip;
}

function checkLoginRateLimit(key: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(key);

  if (!attempts || now > attempts.resetTime) {
    loginAttempts.set(key, { count: 1, resetTime: now + 15 * 60 * 1000 }); // 15 minutes
    return true;
  }

  if (attempts.count >= 5) {
    // 5 tentatives par 15 minutes
    return false;
  }

  attempts.count++;
  return true;
}

function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    // Vérification du rate limiting
    const rateLimitKey = getRateLimitKey(request);
    if (!checkLoginRateLimit(rateLimitKey)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
        },
        { status: 429 }
      );
    }

    // Parse du body JSON
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Format JSON invalide',
        },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // Validation des champs requis
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email est requis',
        },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mot de passe est requis',
        },
        { status: 400 }
      );
    }

    // Validation du format email
    if (!validateEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Format d'email invalide",
        },
        { status: 400 }
      );
    }

    // Sanitization basique pour prévenir les injections
    const sanitizedEmail = email.toLowerCase().trim();

    // Vérification contre les patterns d'injection SQL
    if (
      sanitizedEmail.includes(';') ||
      sanitizedEmail.includes('--') ||
      sanitizedEmail.includes('/*')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Format d'email invalide",
        },
        { status: 400 }
      );
    }

    // Rechercher l'utilisateur par email
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      select: {
        id: true,
        email: true,
        password: true,
        pseudo: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Vérifier si l'utilisateur existe
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email ou mot de passe incorrect',
        },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email ou mot de passe incorrect',
        },
        { status: 401 }
      );
    }

    // Générer un token de session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    // Créer la session en base
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt,
        ipAddress: getRateLimitKey(request),
        userAgent: request.headers.get('user-agent') || 'Unknown',
      },
    });

    // Préparer la réponse avec l'utilisateur sans mot de passe
    const safeUser = sanitizeUserData(user);
    const redirectUrl = getRedirectUrl(user.role);

    // Créer la réponse avec le cookie de session
    const response = NextResponse.json(
      {
        success: true,
        message: 'Connexion réussie',
        user: safeUser,
        token: sessionToken,
        expiresAt: expiresAt.toISOString(),
        redirectUrl,
      },
      { status: 200 }
    );

    // Définir le cookie de session
    response.cookies.set('futsal.session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 jours en secondes
      path: '/',
    });

    // Reset des tentatives de connexion après succès
    loginAttempts.delete(rateLimitKey);

    return response;
  } catch (error) {
    console.error('Login error:', error);

    // Gestion spécifique des erreurs Prisma
    if (error instanceof Error) {
      if (error.message.includes('connection')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Service temporairement indisponible',
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Une erreur interne s'est produite",
      },
      { status: 500 }
    );
  }
}

// Rejeter les autres méthodes HTTP
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
