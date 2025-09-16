import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sanitizeUserData } from '@/lib/auth/utils';

const prisma = new PrismaClient();

function getSessionTokenFromRequest(request: NextRequest): string | null {
  // Essayer d'abord le cookie
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>
    );

    if (cookies['futsal.session-token']) {
      return cookies['futsal.session-token'];
    }
  }

  // Essayer l'header Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Parse du body pour les options (optionnel)
    let options = { logoutFromAllDevices: false };
    try {
      const body = await request.json();
      if (body && typeof body === 'object') {
        options = { ...options, ...body };
      }
    } catch (error) {
      // Ignorer les erreurs de parsing JSON pour le logout
      // L'utilisateur peut quand même se déconnecter
    }

    // Récupérer le token de session
    const sessionToken = getSessionTokenFromRequest(request);

    if (!sessionToken) {
      // Pas de session active, mais c'est OK
      const response = NextResponse.json(
        {
          success: true,
          message: 'Aucune session active trouvée',
        },
        { status: 200 }
      );

      // Nettoyer le cookie au cas où
      response.cookies.set('futsal.session-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });

      return response;
    }

    // Rechercher la session dans la base
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            pseudo: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    let user = null;
    let message = 'Déconnexion réussie';

    if (session) {
      user = session.user;

      if (options.logoutFromAllDevices) {
        // Supprimer toutes les sessions de l'utilisateur
        await prisma.session.deleteMany({
          where: { userId: session.userId },
        });
        message = 'Déconnexion réussie de tous les appareils';
      } else {
        // Supprimer seulement la session courante
        await prisma.session.delete({
          where: { id: session.id },
        });
      }
    } else {
      // Session non trouvée, peut-être expirée ou invalide
      message = 'Aucune session active trouvée';
    }

    // Nettoyer les sessions expirées pendant qu'on y est
    await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    // Préparer la réponse
    const responseData = {
      success: true,
      message,
      ...(user && { user: sanitizeUserData(user) }),
    };

    const response = NextResponse.json(responseData, { status: 200 });

    // Supprimer le cookie de session
    response.cookies.set('futsal.session-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);

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
        error: "Une erreur interne s'est produite lors de la déconnexion",
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
