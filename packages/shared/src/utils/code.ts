/**
 * Utilitaires pour la génération et validation de codes d'activité
 */

/**
 * Génère un code d'activité unique de 8 caractères alphanumériques
 * Format: A-Z, 0-9 (majuscules uniquement)
 * Exemple: "A1B2C3D4"
 */
export function generateActivityCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''

  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    code += chars[randomIndex]
  }

  return code
}

/**
 * Valide le format d'un code d'activité
 * Doit être composé de 8 caractères alphanumériques majuscules
 */
export function isValidActivityCode(code: string): boolean {
  const codeRegex = /^[A-Z0-9]{8}$/
  return codeRegex.test(code)
}

/**
 * Formate un code pour l'affichage (ajoute un espace tous les 4 caractères)
 * Exemple: "A1B2C3D4" -> "A1B2 C3D4"
 */
export function formatActivityCode(code: string): string {
  if (!isValidActivityCode(code)) {
    return code
  }
  return `${code.slice(0, 4)} ${code.slice(4)}`
}

/**
 * Nettoie un code saisi par l'utilisateur
 * Supprime les espaces et convertit en majuscules
 */
export function sanitizeActivityCode(input: string): string {
  return input.replace(/\s/g, '').toUpperCase()
}
