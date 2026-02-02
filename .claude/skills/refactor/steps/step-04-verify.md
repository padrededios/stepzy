---
name: step-04-verify
description: Phase de vérification - s'assurer que le refactoring est réussi
next_step: null
---

# Phase 4: Verify

**Role: QUALITY GUARDIAN** - Ensure refactoring achieved its goals without breaking anything

---

<available_state>
From previous step:
- All transformations applied
- Individual commits created
- Execution log with status
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- ✅ ALL tests must pass - absolutely no exceptions
- 📊 COMPARE metrics - quantify the improvement
- 👀 REVIEW the result - ensure it's actually better
- 📝 DOCUMENT changes - for future maintainers
- 🚫 FORBIDDEN: Declaring success with failing tests or worse metrics
</mandatory_rules>

---

## Actions

### 4.1 Vérification complète des tests

```bash
# Full test suite
npm test

# With coverage to ensure nothing was lost
npm test -- --coverage

# Integration tests if available
npm run test:integration

# E2E tests if applicable
npm run test:e2e

# Specific tests for refactored code
npm test -- --testPathPattern="[target]"
```

### 4.2 Vérification TypeScript

```bash
# Strict type checking
npx tsc --noEmit --strict

# Ensure no new errors introduced
```

### 4.3 Comparaison des métriques

| Metric | Before | After | Target | Status |
|--------|--------|-------|--------|--------|
| Lines of Code | X | Y | <Z | ✅/❌ |
| Max Function Length | X | Y | <50 | ✅/❌ |
| Avg Function Length | X | Y | <20 | ✅/❌ |
| Cyclomatic Complexity | X | Y | <10 | ✅/❌ |
| Number of Functions | X | Y | - | - |
| Test Coverage | X% | Y% | ≥X% | ✅/❌ |
| Any Count | X | Y | 0 | ✅/❌ |

### 4.4 Review du code refactoré

Questions de vérification :
- [ ] Le code est-il plus lisible qu'avant ?
- [ ] Les responsabilités sont-elles mieux séparées ?
- [ ] Les noms sont-ils plus clairs ?
- [ ] La complexité a-t-elle diminué ?
- [ ] Le code est-il plus testable ?
- [ ] Le comportement est-il identique ?

### 4.5 Vérification de non-régression

```bash
# Compare output for key scenarios
# Run the same inputs through old (if available) and new code
# Verify identical results
```

---

## Final Report

```markdown
## 🔧 Refactoring Report: [Target]

### Summary
- **Date**: [YYYY-MM-DD]
- **Target**: [files/module]
- **Status**: ✅ Complete / ⚠️ Partial / ❌ Failed

### Objectives Achievement

| Objective | Status | Notes |
|-----------|--------|-------|
| Reduce function length | ✅ | Max 45 lines (was 120) |
| Improve naming | ✅ | All variables renamed |
| Better separation | ✅ | Extracted TaxService |

### Metrics Comparison

| Metric | Before | After | Δ |
|--------|--------|-------|---|
| Total Lines | 350 | 280 | -70 |
| Functions | 5 | 12 | +7 |
| Max Function Length | 120 | 45 | -75 |
| Avg Function Length | 60 | 20 | -40 |
| Complexity | 28 | 12 | -16 |
| Test Coverage | 85% | 88% | +3% |

### Transformations Applied

| Level | Transformations | Description |
|-------|----------------|-------------|
| 1 | 3 | Variable renames, expression extractions |
| 2 | 4 | Method extractions |
| 3 | 2 | Method moves, class extractions |
| **Total** | **9** | |

### Files Changed
| File | Change Type |
|------|-------------|
| `order.service.ts` | Modified |
| `tax.service.ts` | Created |
| `order.types.ts` | Modified |

### Code Quality

**Before**:
```typescript
// Complex, hard to understand
async function processOrder(order) {
  // 120 lines of mixed concerns
}
```

**After**:
```typescript
// Clear, well-organized
async function processOrder(order: Order) {
  this.validateOrder(order);
  const totals = this.calculateTotals(order);
  await this.persistOrder(order, totals);
}
```

### Test Results
- All tests: ✅ Passing
- Coverage: [X]% (no decrease)
- New tests added: [X]

### Commits
```
abc1234 refactor: improve variable naming
def5678 refactor: extract methods from processOrder
ghi9012 refactor: move tax calculation to TaxService
```

### Behavior Verification
- [ ] All existing tests pass
- [ ] No TypeScript errors
- [ ] Output unchanged for sample inputs
- [ ] Performance unchanged (or improved)

### Recommendations for Future

Based on this refactoring session:
1. Consider adding ESLint rule for max function length
2. The extracted TaxService could be unit tested more thoroughly
3. Similar patterns exist in [other file] - consider applying same refactoring

### Lessons Learned
- [Any insights from this refactoring]
```

---

## Post-Refactoring Checklist

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Metrics improved (or at least not worse)
- [ ] Code is more readable
- [ ] Commits are clean and atomic
- [ ] Documentation updated if needed
- [ ] Team notified of changes (if significant)

---

## 🎉 Refactoring Complete

Le code est maintenant :
- ✅ Plus lisible
- ✅ Mieux structuré
- ✅ Plus maintenable
- ✅ Même comportement garanti

→ **Session terminée**
