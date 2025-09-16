import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedUser {
  id: string;
  email: string;
  pseudo: string;
  avatar?: string | null;
  role: 'user' | 'root';
}

export interface AuthContext {
  user: AuthenticatedUser | null;
  session: {
    token: string;
    expiresAt: Date;
  } | null;
}

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

/**
 * Récupère le contexte d'authentification pour une requête
 */
export async function getAuthContext(
  request: NextRequest
): Promise<AuthContext> {
  try {
    const sessionToken = getSessionTokenFromRequest(request);

    if (!sessionToken) {
      return { user: null, session: null };
    }

    // Rechercher la session en base avec l'utilisateur
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

    if (!session) {
      return { user: null, session: null };
    }

    // Vérifier si la session n'est pas expirée
    if (session.expiresAt < new Date()) {
      // Nettoyer la session expirée
      await prisma.session
        .delete({
          where: { id: session.id },
        })
        .catch(() => {
          // Ignorer les erreurs de suppression
        });

      return { user: null, session: null };
    }

    return {
      user: session.user as AuthenticatedUser,
      session: {
        token: session.token,
        expiresAt: session.expiresAt,
      },
    };
  } catch (error) {
    console.error('Auth context error:', error);
    return { user: null, session: null };
  }
}

/**
 * Middleware pour protéger les routes - nécessite une authentification
 */
export async function requireAuth(
  request: NextRequest,
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const authContext = await getAuthContext(request);

  if (!authContext.user || !authContext.session) {
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      },
      { status: 401 }
    );
  }

  return handler(request, authContext);
}

/**
 * Middleware pour protéger les routes admin - nécessite le rôle root
 */
export async function requireAdmin(
  request: NextRequest,
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const authContext = await getAuthContext(request);

  if (!authContext.user || !authContext.session) {
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      },
      { status: 401 }
    );
  }

  if (authContext.user.role !== 'root') {
    return NextResponse.json(
      {
        success: false,
        error: 'Admin access required',
        code: 'ADMIN_ACCESS_REQUIRED',
      },
      { status: 403 }
    );
  }

  return handler(request, authContext);
}

/**
 * Middleware optionnel - injecte le contexte auth s'il existe
 */
export async function withOptionalAuth(
  request: NextRequest,
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const authContext = await getAuthContext(request);
  return handler(request, authContext);
}

/**
 * Utilitaire pour vérifier un rôle spécifique
 */
export function hasRole(
  user: AuthenticatedUser | null,
  role: 'user' | 'root'
): boolean {
  return user?.role === role;
}

/**
 * Utilitaire pour vérifier si l'utilisateur est admin
 */
export function isAdmin(user: AuthenticatedUser | null): boolean {
  return hasRole(user, 'root');
}

/**
 * Utilitaire pour vérifier si l'utilisateur peut accéder à une ressource
 */
export function canAccessResource(
  user: AuthenticatedUser | null,
  resourceUserId: string
): boolean {
  if (!user) return false;

  // Admin peut accéder à tout
  if (isAdmin(user)) return true;

  // Utilisateur peut accéder à ses propres ressources
  return user.id === resourceUserId;
}

/**
 * Middleware de rate limiting basé sur l'utilisateur
 */
const userRateLimits = new Map<string, { count: number; resetTime: number }>();

export function checkUserRateLimit(
  userId: string,
  maxRequests: number = 100,
  windowMs: number = 60 * 1000
): boolean {
  const now = Date.now();
  const userLimit = userRateLimits.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    userRateLimits.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * Nettoyage périodique des sessions expirées
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  } catch (error) {
    console.error('Session cleanup error:', error);
  }
}

// Nettoyer les sessions expirées toutes les heures
if (typeof window === 'undefined') {
  // Côté serveur seulement
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000); // 1 heure
}
