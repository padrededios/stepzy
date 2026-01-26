---
name: refactor
description: Refactorer du code de manière sécurisée avec préservation du comportement
argument-hint: "[fichier ou pattern] [type-refactoring]"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Task
recommended-model: sonnet
---

# Skill Refactor - Refactoring Sécurisé

Tu es un expert en refactoring avec une approche méthodique. Tu vas transformer le code en préservant strictement son comportement.

## Arguments

- `$ARGUMENTS` : Fichier/pattern + type de refactoring optionnel
  - Exemples : `"user.service.ts extract-method"`, `"src/utils rename-variable"`

## Available State

- `{target}` - Fichier(s) ou pattern à refactorer
- `{refactor_type}` - Type de refactoring (voir catalogue)
- `{economy_mode}` - Si true, utilise des appels directs au lieu de subagents
- `{safe_mode}` - Si true, vérifie après chaque micro-changement
- `{scope}` - file | module | project

---

<mandatory_rules>
## RÈGLES D'EXÉCUTION OBLIGATOIRES (LIRE EN PREMIER)

- 🔒 PRESERVE behavior - refactoring ≠ changing functionality
- 🧪 TEST before, during, after - tests are your safety net
- 👣 SMALL steps - one transformation at a time
- ⏸️ STOP on red - never continue with failing tests
- 📝 COMMIT frequently - ability to rollback is essential
- 🚫 FORBIDDEN: Refactoring untested code (add tests first!)
</mandatory_rules>

---

## Workflow

### Phase 1: Assess → `steps/step-01-assess.md`

**Role: ANALYST** - Understand what needs refactoring and why

1. Analyse le code actuel
2. Identifie les code smells
3. Définis les objectifs du refactoring
4. Vérifie la couverture de tests

### Phase 2: Plan → `steps/step-02-plan.md`

**Role: ARCHITECT** - Design the transformation sequence

1. Choisis les techniques de refactoring appropriées
2. Ordonne les transformations
3. Identifie les risques
4. Prépare les checkpoints

### Phase 3: Execute → `steps/step-03-execute.md`

**Role: SURGEON** - Apply transformations with precision

1. Pour chaque transformation :
   - Tests verts (baseline)
   - Appliquer le changement
   - Tests verts (vérification)
   - Commit
2. Répéter jusqu'à l'objectif

### Phase 4: Verify → `steps/step-04-verify.md`

**Role: QUALITY GUARDIAN** - Ensure success

1. Tests complets
2. Vérification TypeScript
3. Review du résultat
4. Documentation des changements

---

## Catalogue de Refactorings

### 📦 Extract

| Technique | Quand utiliser | Risque |
|-----------|---------------|--------|
| Extract Method | Fonction trop longue, logique répétée | Low |
| Extract Variable | Expression complexe | Low |
| Extract Class | Classe avec trop de responsabilités | Medium |
| Extract Interface | Besoin d'abstraction | Low |
| Extract Module | Fichier trop gros | Medium |

### 🔗 Inline

| Technique | Quand utiliser | Risque |
|-----------|---------------|--------|
| Inline Method | Méthode triviale, plus utilisée qu'une fois | Low |
| Inline Variable | Variable inutile | Low |
| Inline Class | Classe trop petite | Medium |

### 📝 Rename

| Technique | Quand utiliser | Risque |
|-----------|---------------|--------|
| Rename Variable | Nom pas clair | Low |
| Rename Method | Nom ne reflète pas l'action | Low-Medium |
| Rename Class | Nom ne reflète pas la responsabilité | Medium |
| Rename File | Nom incohérent | Medium |

### 🔄 Move

| Technique | Quand utiliser | Risque |
|-----------|---------------|--------|
| Move Method | Méthode dans mauvaise classe | Medium |
| Move Field | Champ dans mauvaise classe | Medium |
| Move File | Fichier mal placé | Medium-High |

### 🏗️ Structure

| Technique | Quand utiliser | Risque |
|-----------|---------------|--------|
| Replace Conditional with Polymorphism | Switch/if-else complexe | High |
| Replace Magic Number with Constant | Valeurs hardcodées | Low |
| Replace Temp with Query | Variable temporaire recalculable | Low |
| Introduce Parameter Object | Trop de paramètres | Medium |
| Decompose Conditional | Condition complexe | Low |

---

## Quick Start

```bash
# Extract method
/refactor "backend/src/services/order.service.ts" extract-method

# Rename across project
/refactor "userId" rename-variable

# Full module refactor
/refactor "src/auth/" restructure

# Safe mode (very careful)
/refactor "payment.ts" --safe
```

## Output

### Refactoring Report

```markdown
## 🔧 Refactoring Report: [Target]

### Objective
[What was the goal of this refactoring]

### Summary
- Transformations applied: [X]
- Files modified: [X]
- Lines changed: +[X] / -[Y]
- Tests: All passing

### Transformations Applied

| # | Type | Description | Risk | Status |
|---|------|-------------|------|--------|
| 1 | Extract Method | `processOrder` → `validateOrder` + `executeOrder` | Low | ✅ |
| 2 | Rename | `x` → `orderTotal` | Low | ✅ |
| 3 | Move | `calculateTax` → `TaxService` | Medium | ✅ |

### Before / After

#### File: order.service.ts
**Before**: 150 lines, 3 methods, complexity 25
**After**: 100 lines, 5 methods, complexity 12

### Code Comparison

**Before**:
```typescript
// Old complex code
```

**After**:
```typescript
// New clean code
```

### Test Results
- Before: [X] passing
- After: [X] passing
- New tests added: [X]

### Quality Improvement
| Metric | Before | After | Δ |
|--------|--------|-------|---|
| Lines of Code | X | Y | -Z |
| Cyclomatic Complexity | X | Y | -Z |
| Function Count | X | Y | +Z |
| Max Function Length | X | Y | -Z |
```

## Anti-patterns

❌ **Ne fais JAMAIS ça** :
- Refactorer du code sans tests
- Changer le comportement pendant le refactoring
- Faire plusieurs refactorings en un commit
- Continuer quand les tests échouent
- Refactorer et ajouter des features en même temps

✅ **Fais TOUJOURS ça** :
- Vérifier la couverture avant de commencer
- Un refactoring = un commit
- Tests verts avant et après chaque transformation
- Commits fréquents pour pouvoir rollback
- Garder les transformations petites et réversibles
