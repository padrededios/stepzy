/**
 * Utilities for date formatting and manipulation
 */
declare const formatDate: (date: Date | string) => string;
declare const formatTime: (date: Date | string) => string;
declare const formatDateTime: (date: Date | string) => string;
declare const formatDateShort: (date: Date | string) => string;
declare const isToday: (date: Date | string) => boolean;
declare const isFuture: (date: Date | string) => boolean;
declare const isPast: (date: Date | string) => boolean;
declare const getTimeUntil: (date: Date | string) => string | null;

/**
 * Utilitaires pour la génération et validation de codes d'activité
 */
/**
 * Génère un code d'activité unique de 8 caractères alphanumériques
 * Format: A-Z, 0-9 (majuscules uniquement)
 * Exemple: "A1B2C3D4"
 */
declare function generateActivityCode(): string;
/**
 * Valide le format d'un code d'activité
 * Doit être composé de 8 caractères alphanumériques majuscules
 */
declare function isValidActivityCode(code: string): boolean;
/**
 * Formate un code pour l'affichage (ajoute un espace tous les 4 caractères)
 * Exemple: "A1B2C3D4" -> "A1B2 C3D4"
 */
declare function formatActivityCode(code: string): string;
/**
 * Nettoie un code saisi par l'utilisateur
 * Supprime les espaces, caractères spéciaux et convertit en majuscules
 * Ne garde que les caractères alphanumériques A-Z0-9
 */
declare function sanitizeActivityCode(input: string): string;

export { formatActivityCode, formatDate, formatDateShort, formatDateTime, formatTime, generateActivityCode, getTimeUntil, isFuture, isPast, isToday, isValidActivityCode, sanitizeActivityCode };
