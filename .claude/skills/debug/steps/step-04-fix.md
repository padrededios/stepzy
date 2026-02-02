---
name: step-04-fix
description: Phase de correction - implémenter un fix minimal et précis
next_step: steps/step-05-verify.md
---

# Phase 4: Fix

**Role: SURGEON** - Precise, minimal intervention with maximum care

---

<available_state>
From previous steps:
- Root cause identified and documented
- Reproduction test that demonstrates the bug
- Complete understanding of the execution flow
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🎯 MINIMAL fix - change only what's necessary
- 🧪 TEST first - update reproduction test to define expected behavior
- 🔒 PRESERVE behavior - don't break existing functionality
- 📝 DOCUMENT why - explain the fix in comments if not obvious
- 🚫 FORBIDDEN: Fixing multiple unrelated issues at once
</mandatory_rules>

---

## Actions

### 4.1 Transformer le test de reproduction

Convertis le test de reproduction en test de régression :

```typescript
// AVANT (reproduction - échoue)
it('should reproduce the issue', async () => {
  await expect(action()).rejects.toThrow('[Error]');
});

// APRÈS (régression - doit passer après le fix)
it('should handle [case] correctly', async () => {
  // GIVEN
  const setup = await createMinimalSetup();

  // WHEN
  const result = await setup.performAction();

  // THEN - le comportement attendu APRÈS le fix
  expect(result).toEqual(expectedCorrectBehavior);
});
```

### 4.2 Exécuter le test (RED)

```bash
# Le test doit échouer AVANT le fix
npm test -- --testPathPattern="[bug-test]"
# Expected: FAIL
```

### 4.3 Implémenter le fix minimal

Applique la correction :

```typescript
// Fichier: [path/to/file.ts]
// Ligne: [XX]

// AVANT
const problematicCode = something.that.breaks;

// APRÈS (avec commentaire explicatif si nécessaire)
// Fix: Handle undefined case - see debug session [DATE]
const fixedCode = something?.that?.doesNotBreak ?? defaultValue;
```

**Checklist du fix** :
- [ ] Change le minimum de code possible
- [ ] Ne modifie pas la signature des fonctions publiques (sauf si nécessaire)
- [ ] Préserve la rétrocompatibilité
- [ ] Ajoute de la validation si la root cause est un input invalide
- [ ] Ajoute du logging si c'est un cas difficile à diagnostiquer

### 4.4 Exécuter le test (GREEN)

```bash
# Le test doit passer APRÈS le fix
npm test -- --testPathPattern="[bug-test]"
# Expected: PASS
```

### 4.5 Ajouter des tests de couverture

Ajoute des tests pour les cas limites découverts :

```typescript
describe('[Component] edge cases', () => {
  it('should handle null input', async () => {
    // Test découvert pendant le debug
  });

  it('should handle empty array', async () => {
    // Autre cas limite
  });

  it('should handle concurrent calls', async () => {
    // Si race condition identifiée
  });
});
```

---

## Fix Categories

### Type A: Null/Undefined Guard
```typescript
// Ajoute une vérification de nullité
const value = obj?.property ?? defaultValue;
```

### Type B: Validation Missing
```typescript
// Ajoute une validation d'input
if (!isValid(input)) {
  throw new ValidationError('Invalid input: [reason]');
}
```

### Type C: Race Condition
```typescript
// Ajoute un lock ou gestion de concurrence
const result = await mutex.runExclusive(async () => {
  return await riskyOperation();
});
```

### Type D: State Corruption
```typescript
// Corrige la gestion d'état
// Clone au lieu de mutate
const newState = { ...oldState, updated: value };
```

### Type E: Logic Error
```typescript
// Corrige la logique
// AVANT: if (a > b)  // Mauvaise condition
// APRÈS: if (a >= b) // Bonne condition
```

---

## Output de cette phase

```markdown
## Fix Report

### Test Update
- File: `tests/[...].test.ts`
- Status: RED → GREEN

### Changes Made
| File | Change | Reason |
|------|--------|--------|
| [...] | [...] | [...] |

### Diff Summary
```diff
- const old = problematic.code;
+ const new = fixed.code;
```

### Fix Category
- [ ] Null/Undefined Guard
- [ ] Validation Missing
- [ ] Race Condition
- [ ] State Corruption
- [ ] Logic Error
- [ ] Other: [...]

### Additional Tests Added
- [ ] Test 1: [description]
- [ ] Test 2: [description]
```

---

→ **Next**: `step-05-verify.md` - Verify complete resolution
