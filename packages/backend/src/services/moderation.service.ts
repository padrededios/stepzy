/**
 * Moderation Service - Content filtering with French dictionary
 */

import {
  RegExpMatcher,
  TextCensor,
  englishDataset,
  englishRecommendedTransformers,
  pattern,
  assignIncrementingIds
} from 'obscenity'

// French profanity patterns (common insults and variants)
const frenchPatterns = assignIncrementingIds([
  // Insultes courantes
  pattern`merde`,
  pattern`putain`,
  pattern`connard`,
  pattern`connasse`,
  pattern`salope`,
  pattern`salaud`,
  pattern`enculé`,
  pattern`enculee`,
  pattern`fdp`, // fils de pute
  pattern`fils de pute`,
  pattern`filsdepute`,
  pattern`pute`,
  pattern`con`,
  pattern`conne`,
  pattern`couille`,
  pattern`couilles`,
  pattern`bite`,
  pattern`chier`,
  pattern`niquer`,
  pattern`nique`,
  pattern`pd`, // pédé
  pattern`pédale`,
  pattern`pedale`,
  pattern`tapette`,
  pattern`taré`,
  pattern`taree`,
  pattern`débile`,
  pattern`debile`,
  pattern`abruti`,
  pattern`abrutie`,
  pattern`idiot`,
  pattern`idiote`,
  pattern`crétin`,
  pattern`cretine`,
  pattern`batard`,
  pattern`bâtard`,
  pattern`batarde`,
  pattern`bâtarde`,

  // Termes discriminatoires
  pattern`négro`,
  pattern`negro`,
  pattern`nègre`,
  pattern`negre`,
  pattern`bicot`,
  pattern`bougnoule`,
  pattern`raton`,
  pattern`youpin`,
  pattern`feuj`,

  // Leetspeak/variantes (chiffres)
  pattern`m[3e]rd[3e]`,
  pattern`p[0o]ut[4a]in`,
  pattern`c[0o]nn[4a]rd`,
  pattern`[3e]ncul[3e]`,
  pattern`b[1i]t[3e]`,
  pattern`ch[1i][3e]r`,
  pattern`n[1i]qu[3e]r`,
  pattern`p[3e]d[4a]l[3e]`,
  pattern`t[4a]p[3e]tt[3e]`,
  pattern`d[3e]b[1i]l[3e]`,
  pattern`[4a]brut[1i]`,
  pattern`cr[3e]t[1i]n`,

  // Variantes avec espaces
  pattern`c o n`,
  pattern`p d`,
  pattern`f d p`,
  pattern`s a l o p e`,

  // Expressions vulgaires
  pattern`va te faire`,
  pattern`vatefaire`,
  pattern`ta gueule`,
  pattern`tagueule`,
  pattern`ferme ta gueule`,
  pattern`fermetagueule`,
  pattern`va niquer`,
  pattern`vaniquer`,
  pattern`enculer`,
])

// Build the matcher with both English and French datasets
const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...frenchPatterns
})

// Text censor to replace profanity
const censor = new TextCensor()

export class ModerationService {
  /**
   * Check if text contains profanity
   */
  static isProfane(text: string): boolean {
    if (!text || typeof text !== 'string') return false

    const matches = matcher.getAllMatches(text.toLowerCase())
    return matches.length > 0
  }

  /**
   * Censor profanity in text (replace with ***)
   */
  static censorText(text: string): string {
    if (!text || typeof text !== 'string') return text

    const matches = matcher.getAllMatches(text.toLowerCase())

    if (matches.length === 0) {
      return text
    }

    // Replace each match with ***
    return censor.applyTo(text, matches)
  }

  /**
   * Moderate message content
   * Returns { content: string, isModerated: boolean, originalContent?: string }
   */
  static moderateMessage(text: string): {
    content: string
    isModerated: boolean
    originalContent?: string
  } {
    if (!text || typeof text !== 'string') {
      return {
        content: text,
        isModerated: false
      }
    }

    const isProfane = this.isProfane(text)

    if (!isProfane) {
      return {
        content: text,
        isModerated: false
      }
    }

    // Text contains profanity - censor it
    const censoredContent = this.censorText(text)

    return {
      content: censoredContent,
      isModerated: true,
      originalContent: text
    }
  }

  /**
   * Get profanity matches for debugging
   */
  static getMatches(text: string): Array<{ start: number; end: number; matched: string }> {
    if (!text || typeof text !== 'string') return []

    const matches = matcher.getAllMatches(text.toLowerCase())

    return matches.map(match => ({
      start: match.startIndex,
      end: match.endIndex,
      matched: text.substring(match.startIndex, match.endIndex)
    }))
  }
}
