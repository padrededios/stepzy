// Validation utilitaires séparés pour éviter les problèmes avec Better-auth dans les tests
import bcrypt from 'bcryptjs';

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

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

export function generateAvatarUrl(pseudo: string): string {
  // Utilise DiceBear pour générer des avatars basés sur le pseudo
  const encodedPseudo = encodeURIComponent(pseudo);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodedPseudo}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`;
}

export function sanitizeUserData(userData: any) {
  const { password, ...safeUserData } = userData;
  return safeUserData;
}
