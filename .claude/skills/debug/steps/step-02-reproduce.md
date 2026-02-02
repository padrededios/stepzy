---
name: step-02-reproduce
description: Phase de reproduction - créer un cas de reproduction fiable
next_step: steps/step-03-investigate.md
---

# Phase 2: Reproduce

**Role: SCIENTIST** - Create a reliable, minimal reproduction case

---

<available_state>
From previous step:
- Understanding Report with error details and hypotheses
- List of affected components
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🔁 REPRODUCE before fixing - you cannot fix what you cannot see
- 📉 MINIMIZE the reproduction case - remove all non-essential elements
- 📝 DOCUMENT exact steps - anyone should be able to reproduce
- ⏱️ MEASURE consistency - how often does it happen?
- 🚫 FORBIDDEN: Proceeding without a reproduction (unless impossible)
</mandatory_rules>

---

## Actions

### 2.1 Créer un test de reproduction

Écris un test qui déclenche le bug :

```typescript
// tests/debug/[bug-name].reproduction.test.ts

describe('BUG: [Description courte]', () => {
  it('should reproduce the issue', async () => {
    // GIVEN - Setup the conditions
    const setup = await createMinimalSetup();

    // WHEN - Execute the action that triggers the bug
    const action = () => setup.triggerBug();

    // THEN - The bug should manifest
    // Note: Ce test DOIT échouer actuellement
    await expect(action()).rejects.toThrow('[Expected error]');
    // OU
    // expect(result).toBe(expectedButBroken);
  });

  // Cas limites pour comprendre le scope
  it('should work with [variation A]', async () => {
    // Test qui devrait passer - délimite le bug
  });

  it('should fail with [variation B]', async () => {
    // Autre cas qui reproduit le bug
  });
});
```

### 2.2 Vérifier la reproduction

```bash
# Exécute le test de reproduction
npm test -- --testPathPattern="reproduction"

# Vérifie que le test échoue de manière consistante
npm test -- --testPathPattern="reproduction" --repeat=5
```

### 2.3 Documenter les conditions

| Condition | Requis pour reproduire? |
|-----------|------------------------|
| Utilisateur authentifié | oui/non |
| Données spécifiques | oui/non |
| État préalable | oui/non |
| Timing particulier | oui/non |
| Configuration | oui/non |

### 2.4 Identifier les variables

Quelles variables affectent le bug ?
- Input A: quand [valeur], le bug se produit / ne se produit pas
- State B: quand [état], le bug se produit / ne se produit pas
- Config C: quand [config], le bug se produit / ne se produit pas

---

## Si reproduction impossible

Si le bug ne peut pas être reproduit :
1. Ajoute plus de logging dans les zones suspectes
2. Demande plus d'informations à l'utilisateur
3. Cherche des race conditions ou problèmes de timing
4. Vérifie les différences d'environnement

```typescript
// Ajoute du logging temporaire
console.debug('[DEBUG-TRACE]', {
  timestamp: Date.now(),
  function: 'functionName',
  input: input,
  state: relevantState,
});
```

---

## Output de cette phase

```markdown
## Reproduction Report

### Test de reproduction
- Fichier: `tests/debug/[bug-name].reproduction.test.ts`
- Résultat: ✅ Bug reproduit / ❌ Non reproductible

### Conditions minimales
| Condition | Valeur |
|-----------|--------|
| [...] | [...] |

### Variations testées
| Variation | Bug présent? |
|-----------|-------------|
| [...] | oui/non |

### Fréquence
- [ ] Always (100%)
- [ ] Often (>50%)
- [ ] Sometimes (<50%)
- [ ] Rare (<10%)
- [ ] Intermittent/Random

### Steps to reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]
4. → Bug appears
```

---

→ **Next**: `step-03-investigate.md` - Deep dive to find root cause
