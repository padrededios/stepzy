---
name: clean-code
description: Nettoyer et améliorer la qualité du code sans changer le comportement
argument-hint: "[fichier, dossier, ou 'all']"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Task
recommended-model: sonnet
---

# Skill Clean Code - Nettoyage et Amélioration

Tu es un expert en clean code et qualité logicielle. Tu vas analyser et améliorer le code de manière méthodique en préservant le comportement.

## Arguments

- `$ARGUMENTS` : Chemin fichier, dossier, ou "all" pour tout le projet

## Available State

- `{target}` - Fichier(s) ou dossier à nettoyer
- `{scope}` - file | directory | project
- `{economy_mode}` - Si true, utilise des appels directs au lieu de subagents
- `{aggressive_mode}` - Si true, applique des refactorings plus profonds
- `{dry_run}` - Si true, liste les changements sans les appliquer

---

<mandatory_rules>
## RÈGLES D'EXÉCUTION OBLIGATOIRES (LIRE EN PREMIER)

- 🔒 PRESERVE behavior - cleaning ≠ changing functionality
- 🧪 TEST before and after - ensure no regression
- 📏 FOLLOW existing conventions - don't impose new patterns
- 🎯 ONE concern at a time - separate commits for separate changes
- 🚫 FORBIDDEN: Changing public APIs without explicit permission
</mandatory_rules>

---

## Workflow

### Phase 1: Analyze → `steps/step-01-analyze.md`

**Role: CODE AUDITOR** - Identify all code quality issues

1. Lance des agents parallèles pour détecter :
   - Code mort (unused exports, unreachable code)
   - Code dupliqué
   - Complexité excessive
   - Violations de conventions
   - Problèmes de typage

### Phase 2: Prioritize → `steps/step-02-prioritize.md`

**Role: STRATEGIST** - Rank issues by impact and risk

1. Classe les problèmes par :
   - Impact (high/medium/low)
   - Risque (high/medium/low)
   - Effort (high/medium/low)
2. Propose un plan d'action

### Phase 3: Clean → `steps/step-03-clean.md`

**Role: CRAFTSMAN** - Apply improvements systematically

1. Pour chaque catégorie de problème :
   - Exécute les tests (baseline)
   - Applique les corrections
   - Vérifie les tests
   - Commit séparé

### Phase 4: Verify → `steps/step-04-verify.md`

**Role: QUALITY GATE** - Ensure code is better, not broken

1. Tests complets
2. Vérification TypeScript
3. Lint propre
4. Rapport de qualité

---

## Categories de Nettoyage

### 🗑️ Dead Code
- Exports non utilisés
- Imports non utilisés
- Fonctions jamais appelées
- Branches de code inaccessibles
- Commentaires obsolètes

### 📋 Duplication
- Code copié-collé
- Logique répétée
- Patterns duplicates

### 🏗️ Structure
- Fonctions trop longues (>50 lignes)
- Fichiers trop gros (>300 lignes)
- Nesting trop profond (>3 niveaux)
- God classes/modules

### 📝 Naming
- Variables mal nommées (x, temp, data)
- Fonctions mal nommées (doStuff, handleThing)
- Incohérences de convention

### 🔧 TypeScript
- `any` à remplacer par types précis
- Types manquants
- Assertions inutiles

### 📚 Documentation
- Commentaires obsolètes
- Code commenté à supprimer
- TODOs oubliés

---

## Quick Start

```bash
# Nettoyer un fichier
/clean-code "backend/src/services/user.service.ts"

# Nettoyer un dossier
/clean-code "backend/src/services"

# Nettoyer tout le projet (attention!)
/clean-code all

# Mode dry-run pour prévisualiser
/clean-code "src/" --dry-run
```

## Output

### Clean Code Report

```markdown
## 🧹 Clean Code Report: [Target]

### Summary
- Files analyzed: [X]
- Issues found: [X]
- Issues fixed: [X]
- Issues skipped: [X] (need manual review)

### Changes by Category
| Category | Found | Fixed | Risk |
|----------|-------|-------|------|
| Dead Code | X | X | Low |
| Duplication | X | X | Medium |
| Structure | X | X | Medium |
| Naming | X | X | Low |
| TypeScript | X | X | Low |

### Detailed Changes
#### File: [path/to/file.ts]
- ✅ Removed unused import `lodash`
- ✅ Renamed `x` to `userCount`
- ✅ Replaced `any` with `User[]`

### Verification
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Lint clean
- [ ] Behavior preserved
```

## Anti-patterns

❌ **Ne fais JAMAIS ça** :
- Changer la logique métier pendant le nettoyage
- Renommer des exports publics sans migration
- Supprimer du code "qui semble" inutilisé sans vérifier
- Refactorer sans tests
- Tout changer d'un coup

✅ **Fais TOUJOURS ça** :
- Vérifier que le code est vraiment inutilisé (grep/usage check)
- Commits atomiques par type de changement
- Messages de commit descriptifs
- Garder les tests verts à chaque étape
- Préserver la compatibilité
