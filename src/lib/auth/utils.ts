import bcrypt from 'bcryptjs';
import { auth } from './config';

// Types pour les utilitaires auth
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export interface AuthError {
  code: string;
  message: string;
}

// Utilitaires de mot de passe
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Gestion des sessions
export async function getCurrentSession() {
  try {
    return await auth.api.getSession({
      headers: new Headers()
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error);
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return !!session?.user;
}

export async function hasRole(role: string): Promise<boolean> {
  const session = await getCurrentSession();
  return session?.user?.role === role;
}

export async function isAdmin(): Promise<boolean> {
  return hasRole('root');
}

export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Authentication required');
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== 'root') {
    throw new Error('Admin access required');
  }
  return session;
}

// Validation des données utilisateur
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePseudo(pseudo: string): boolean {
  if (!pseudo || pseudo.length < 3 || pseudo.length > 30) {
    return false;
  }

  // Seules les lettres, chiffres et underscores sont autorisés
  const pseudoRegex = /^[a-zA-Z0-9_]+$/;
  return pseudoRegex.test(pseudo);
}

// Gestion des erreurs d'authentification
export function formatAuthError(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
    EMAIL_ALREADY_EXISTS: 'Un compte avec cet email existe déjà',
    WEAK_PASSWORD: 'Le mot de passe ne respecte pas les critères de sécurité',
    PSEUDO_REQUIRED: 'Le pseudo est obligatoire',
    INVALID_EMAIL: "Format d'email invalide",
    INVALID_PSEUDO:
      'Le pseudo doit contenir entre 3 et 30 caractères alphanumériques',
    SESSION_EXPIRED: 'Votre session a expiré, veuillez vous reconnecter',
    ACCESS_DENIED: 'Accès refusé',
    USER_NOT_FOUND: 'Utilisateur introuvable',
    ACCOUNT_LOCKED: 'Compte temporairement verrouillé',
    RATE_LIMITED: 'Trop de tentatives, veuillez réessayer plus tard',
  };

  return errorMessages[errorCode] || "Une erreur inattendue s'est produite";
}

// Génération d'avatar
export function generateAvatarUrl(pseudo: string): string {
  // Utilise DiceBear pour générer des avatars basés sur le pseudo
  const encodedPseudo = encodeURIComponent(pseudo);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodedPseudo}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`;
}

// Utilitaires de redirection
export function getRedirectUrl(role: string, returnTo?: string): string {
  // Si une URL de retour est spécifiée et sécurisée, l'utiliser
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo;
  }

  // Redirection par défaut selon le rôle
  if (role === 'root') {
    return '/admin';
  }

  return '/dashboard';
}

// Nettoyage et sécurisation des données utilisateur
export function sanitizeUserData(userData: any) {
  const { password, ...safeUserData } = userData;
  return safeUserData;
}

// Vérification de la force du pseudo
export function validatePseudoStrength(pseudo: string): PasswordValidation {
  const errors: string[] = [];

  if (!pseudo || pseudo.trim().length === 0) {
    errors.push('Le pseudo est obligatoire');
  }

  if (pseudo.length < 3) {
    errors.push('Le pseudo doit contenir au moins 3 caractères');
  }

  if (pseudo.length > 30) {
    errors.push('Le pseudo ne peut pas dépasser 30 caractères');
  }

  if (!/^[a-zA-Z0-9_]+$/.test(pseudo)) {
    errors.push(
      'Le pseudo ne peut contenir que des lettres, chiffres et underscores'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
