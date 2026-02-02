---
name: step-05-verify
description: Phase de vérification - s'assurer que le fix est complet et sans régression
next_step: null
---

# Phase 5: Verify

**Role: QUALITY GUARDIAN** - Ensure complete resolution without regressions

---

<available_state>
From previous steps:
- Fix implemented
- Regression test passing
- Additional edge case tests added
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- ✅ VERIFY the original issue is fixed - test manually if needed
- 🔄 RUN full test suite - catch any regressions
- 📊 CHECK coverage - ensure the fix is well tested
- 📝 DOCUMENT the resolution - future debugging aid
- 🚫 FORBIDDEN: Closing without full verification
</mandatory_rules>

---

## Actions

### 5.1 Vérification directe

```bash
# Exécute le test de régression spécifique
npm test -- --testPathPattern="[bug-test]"
# Expected: PASS

# Vérifie que le scénario original fonctionne
# (test manuel ou automatisé selon le cas)
```

### 5.2 Suite de tests complète

```bash
# Lance TOUS les tests
npm test

# Avec couverture pour vérifier
npm test -- --coverage

# Tests d'intégration si applicable
npm run test:integration

# Tests E2E si applicable
npm run test:e2e
```

### 5.3 Vérification des régressions

Checklist des zones à risque :
- [ ] Fonctionnalités liées au code modifié
- [ ] Autres usages des fonctions/composants modifiés
- [ ] Dépendances en aval (qui utilise ce code?)
- [ ] Performance (pas de dégradation?)
- [ ] Comportement async/concurrent

### 5.4 Validation TypeScript

```bash
# Vérifie les types
npm run type-check
# OU
npx tsc --noEmit

# Vérifie le lint
npm run lint
```

### 5.5 Documentation

Mets à jour si nécessaire :
- [ ] Commentaires dans le code
- [ ] README si changement de comportement
- [ ] CHANGELOG si applicable
- [ ] Documentation API si endpoint modifié

---

## Final Debug Session Report

Génère le rapport final :

```markdown
## 🔍 Debug Session Report

### Bug Information
- **ID**: [bug-id ou description courte]
- **Date**: [YYYY-MM-DD]
- **Severity**: [Critical/High/Medium/Low]
- **Type**: [Crash/Incorrect behavior/Performance/Security]

### Summary
[1-2 phrases décrivant le bug et sa résolution]

### Root Cause
[Explication technique de la cause racine]

### Solution
[Description de la correction appliquée]

### Files Changed
| File | Type of Change |
|------|---------------|
| [...] | [...] |

### Tests
- **Regression test**: `path/to/test.ts`
- **Additional tests**: [count] added
- **Coverage**: [X]%

### Verification
- [ ] Original issue fixed
- [ ] All tests passing
- [ ] No regressions detected
- [ ] Types valid
- [ ] Lint passing
- [ ] Documentation updated

### Prevention
**How to prevent this in the future:**
- [Suggestion 1]
- [Suggestion 2]

### Related
- [ ] Consider adding to coding guidelines
- [ ] Consider adding automated check
- [ ] Consider improving error messages
```

---

## Commit Message Format

```bash
git commit -m "$(cat <<'EOF'
fix([scope]): [short description]

Root cause: [brief explanation of why the bug existed]

- [Change 1]
- [Change 2]

Fixes #[issue-number] (if applicable)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Session Saving (if save_session=true)

```bash
# Sauvegarde la session de debug
mkdir -p docs/debug-sessions
cat > docs/debug-sessions/[YYYY-MM-DD]-[bug-name].md << 'EOF'
[Full Debug Session Report from above]
EOF
```

---

## 🎉 Debug Complete

Le bug a été :
- ✅ Identifié
- ✅ Reproduit
- ✅ Analysé
- ✅ Corrigé
- ✅ Vérifié

→ **Session terminée**
