import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  validateEmail,
  validatePseudo,
  validatePasswordStrength,
  generateAvatarUrl,
  hashPassword,
} from '@/lib/auth/validators';

const prisma = new PrismaClient();

// Rate limiting simple en mémoire (en production, utiliser Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return ip;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(key);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + 60 * 1000 }); // 1 minute
    return true;
  }

  if (limit.count >= 3) {
    // 3 tentatives par minute
    return false;
  }

  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Vérification du rate limiting
    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Trop de tentatives, veuillez réessayer plus tard',
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

    const { email, password, pseudo, avatar } = body;

    // Validation des champs requis
    const errors: string[] = [];

    if (!email) {
      errors.push('Email est requis');
    } else if (!validateEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Format d'email invalide",
        },
        { status: 400 }
      );
    }

    if (!password) {
      errors.push('Mot de passe est requis');
    } else {
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return NextResponse.json(
          {
            success: false,
            error: passwordValidation.errors[0],
          },
          { status: 400 }
        );
      }
    }

    if (!pseudo) {
      errors.push('Pseudo est requis');
    } else if (!validatePseudo(pseudo)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Le pseudo doit contenir entre 3 et 30 caractères alphanumériques',
        },
        { status: 400 }
      );
    }

    // Vérification des caractères malicieux dans le pseudo (XSS prevention)
    if (pseudo && /<[^>]*>/g.test(pseudo)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Le pseudo contient des caractères non autorisés',
        },
        { status: 400 }
      );
    }

    // Retourner les erreurs de validation
    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          errors,
        },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Un compte avec cet email existe déjà',
        },
        { status: 409 }
      );
    }

    // Générer l'avatar si non fourni
    const userAvatar = avatar || generateAvatarUrl(pseudo);

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password);

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        pseudo: pseudo.trim(),
        avatar: userAvatar,
        role: 'user',
      },
      select: {
        id: true,
        email: true,
        pseudo: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Compte créé avec succès',
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    // Gestion spécifique des erreurs Prisma
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint failed')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Un compte avec cet email existe déjà',
          },
          { status: 409 }
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
