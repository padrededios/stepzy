---
name: step-04-verify
description: Phase de vérification - s'assurer que le code est meilleur sans régressions
next_step: null
---

# Phase 4: Verify

**Role: QUALITY GATE** - Ensure code is better, not broken

---

<available_state>
From previous step:
- All batches applied
- Individual commits created
- Test results after each batch
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- ✅ ALL tests must pass - no exceptions
- 📊 MEASURE improvement - quantify the gains
- 🔍 REVIEW changes - final sanity check
- 📝 DOCUMENT results - create summary report
- 🚫 FORBIDDEN: Leaving code in worse state than before
</mandatory_rules>

---

## Actions

### 4.1 Suite de tests complète

```bash
# Tous les tests
npm test

# Avec couverture
npm test -- --coverage

# Tests d'intégration
npm run test:integration

# E2E si applicable
npm run test:e2e
```

### 4.2 Vérification TypeScript

```bash
# Mode strict
npx tsc --noEmit --strict

# Comptage des erreurs avant/après
echo "TypeScript errors: $(npx tsc --noEmit 2>&1 | grep -c 'error TS')"
```

### 4.3 Lint complet

```bash
# ESLint
npx eslint . --format json > /tmp/eslint-after.json

# Comparer avec avant
echo "Lint warnings before: [X]"
echo "Lint warnings after: [Y]"
```

### 4.4 Métriques de qualité

Comparer les métriques avant/après :

```markdown
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Lines of code | X | Y | -Z |
| Files | X | Y | ±0 |
| `any` count | X | Y | -Z |
| Unused exports | X | 0 | -X |
| Lint warnings | X | Y | -Z |
| Test coverage | X% | Y% | +Z% |
| Avg function length | X | Y | -Z |
```

### 4.5 Review visuel des diffs

```bash
# Review tous les changements
git diff HEAD~4..HEAD --stat

# Review chaque fichier modifié
git diff HEAD~4..HEAD -- path/to/important/file.ts
```

Checklist de review :
- [ ] Pas de changement de comportement accidentel
- [ ] Les nommages sont cohérents
- [ ] Les types sont corrects
- [ ] Pas de code important supprimé par erreur

---

## Final Report

```markdown
## 🧹 Clean Code Report

### Summary
- **Target**: `{target}`
- **Date**: [YYYY-MM-DD]
- **Status**: ✅ Complete / ⚠️ Partial / ❌ Failed

### Metrics Improvement
| Metric | Before | After | Δ |
|--------|--------|-------|---|
| Lines of Code | [...] | [...] | [...] |
| Any Types | [...] | [...] | [...] |
| Unused Code | [...] | [...] | [...] |
| Lint Warnings | [...] | [...] | [...] |
| Complexity Score | [...] | [...] | [...] |

### Changes Applied
| Category | Changes | Impact |
|----------|---------|--------|
| Unused Imports | Removed [X] | -[Y] lines |
| Dead Code | Removed [X] functions | -[Y] lines |
| Naming | Renamed [X] variables | Clarity |
| Types | Added [X] types | Safety |
| Structure | Refactored [X] functions | Maintainability |

### Commits
```
abc1234 chore: remove unused imports
def5678 chore: remove dead code
ghi9012 refactor: improve variable naming
jkl3456 refactor: improve type safety
```

### Tests
- **Unit tests**: [X] passing
- **Integration tests**: [X] passing
- **Coverage**: [X]% (Δ +[Y]%)
- **Regressions**: 0

### Skipped (Needs Manual Review)
| Item | Reason |
|------|--------|
| [...] | [...] |

### Recommendations
- [ ] Consider extracting `[component]` to separate module
- [ ] Review `[file]` for further optimization
- [ ] Add tests for `[function]`

### Quality Gates
- [x] All tests passing
- [x] No TypeScript errors
- [x] Lint warnings reduced
- [x] No behavior changes
- [x] Code is cleaner and more maintainable
```

---

## Post-Cleaning

### Optionnel: Squash commits

Si demandé, squasher les commits de cleaning :

```bash
git rebase -i HEAD~4
# Squash all into one commit:
# "chore: clean code in [target]"
```

### Documentation

Si des patterns ont été identifiés, suggérer :
- Ajout de règles ESLint
- Mise à jour du guide de style
- Création de snippets/templates

---

## 🎉 Nettoyage Terminé

Le code est maintenant :
- ✅ Plus propre
- ✅ Plus lisible
- ✅ Plus maintenable
- ✅ Toujours fonctionnel

→ **Session terminée**
