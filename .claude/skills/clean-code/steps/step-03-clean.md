---
name: step-03-clean
description: Phase de nettoyage - appliquer les améliorations de manière systématique
next_step: steps/step-04-verify.md
---

# Phase 3: Clean

**Role: CRAFTSMAN** - Apply improvements systematically with precision

---

<available_state>
From previous step:
- Prioritized issue list
- Execution plan with batches
- Estimated changes per batch
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🧪 TEST between batches - never break the build
- 📦 ONE batch = ONE commit - atomic changes
- 🔍 VERIFY each change - double-check before committing
- ⏸️ STOP on failure - don't continue if tests break
- 🚫 FORBIDDEN: Changing behavior during cleanup
</mandatory_rules>

---

## Actions

### 3.0 Baseline

```bash
# Établir la baseline AVANT tout changement
npm test > /tmp/baseline-tests.log
echo "Tests passing: $(grep -c 'PASS' /tmp/baseline-tests.log)"

# Vérifier les types
npx tsc --noEmit
```

### 3.1 Batch 1: Unused Imports

```bash
# Checkpoint
git stash -u  # Sauvegarder tout changement non-commit
```

Pour chaque fichier avec des imports inutilisés :

```typescript
// AVANT
import { used, unused } from 'package';
import { alsoUnused } from 'other-package';

// APRÈS
import { used } from 'package';
```

Vérification :
```bash
# Tests rapides
npm test -- --bail

# Si tout passe, commit
git add -A && git commit -m "$(cat <<'EOF'
chore: remove unused imports

- file1.ts: removed unused import from 'pkg'
- file2.ts: removed unused import from 'other'

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### 3.2 Batch 2: Dead Code

Pour chaque fonction/export non utilisé :

1. **Vérification finale** que le code est vraiment inutilisé :
```bash
# Double-check qu'aucune référence n'existe
grep -r "functionName" --include="*.ts" --include="*.tsx"
```

2. **Suppression** :
```typescript
// SUPPRIMER entièrement
// export function unusedFunction() { ... }
```

3. **Commit** :
```bash
npm test -- --bail
git add -A && git commit -m "$(cat <<'EOF'
chore: remove dead code

- utils.ts: removed unused function `unusedFn`
- helpers.ts: removed unused constant `UNUSED_CONST`

Verified no references exist in codebase.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### 3.3 Batch 3: Naming Improvements

Pour chaque variable/fonction mal nommée :

```typescript
// AVANT
const x = users.length;
const temp = transform(data);

// APRÈS
const userCount = users.length;
const transformedData = transform(data);
```

**Important**: Utiliser le rename automatique de l'éditeur ou vérifier toutes les références.

```bash
npm test -- --bail
git add -A && git commit -m "$(cat <<'EOF'
refactor: improve variable naming for clarity

- api.ts: x → userCount
- service.ts: temp → transformedData
- handler.ts: d → document

No behavioral changes.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### 3.4 Batch 4: TypeScript Improvements

Pour chaque `any` ou type manquant :

```typescript
// AVANT
function process(data: any): any {
  return data.map((x: any) => x.id);
}

// APRÈS
function process(data: User[]): string[] {
  return data.map((user: User) => user.id);
}
```

```bash
npm test -- --bail
npx tsc --noEmit  # Vérifier que les types sont corrects
git add -A && git commit -m "$(cat <<'EOF'
refactor: improve type safety

- types.ts: replaced `any` with proper User type
- handler.ts: added return type annotations
- api.ts: typed function parameters

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### 3.5 Batch 5: Structure (si applicable)

Pour les fonctions trop longues, extraire en sous-fonctions :

```typescript
// AVANT - fonction de 100 lignes
function bigFunction() {
  // step 1: validation (20 lines)
  // step 2: processing (40 lines)
  // step 3: formatting (40 lines)
}

// APRÈS - fonctions séparées
function bigFunction() {
  const validated = validateInput(input);
  const processed = processData(validated);
  return formatOutput(processed);
}

function validateInput(input: Input): ValidatedInput { ... }
function processData(data: ValidatedInput): ProcessedData { ... }
function formatOutput(data: ProcessedData): Output { ... }
```

---

## Gestion des erreurs

Si un test échoue après un changement :

1. **Ne pas paniquer**
2. Identifier quel changement a cassé le test
3. Options :
   - Corriger le changement si c'est une erreur
   - Reverter le changement si trop risqué
   - Marquer pour review manuelle

```bash
# Reverter le dernier batch si nécessaire
git reset --hard HEAD~1
```

---

## Output de cette phase

```markdown
## Cleaning Log

### Batch Execution

| Batch | Status | Files | Lines Changed |
|-------|--------|-------|---------------|
| 1. Unused Imports | ✅ Done | 5 | -15 |
| 2. Dead Code | ✅ Done | 3 | -45 |
| 3. Naming | ✅ Done | 4 | 12 (renames) |
| 4. TypeScript | ✅ Done | 6 | +25 (types) |
| 5. Structure | ⏭️ Skipped | - | - |

### Commits Created
1. `abc123` - chore: remove unused imports
2. `def456` - chore: remove dead code
3. `ghi789` - refactor: improve variable naming
4. `jkl012` - refactor: improve type safety

### Test Results
- Before: [X] passing, [Y] failing
- After: [X] passing, [Y] failing
- Regressions: 0

### Changes Summary
- Files modified: [X]
- Lines removed: [X]
- Lines added: [X]
- Net change: [X]
```

---

→ **Next**: `step-04-verify.md` - Final quality verification
