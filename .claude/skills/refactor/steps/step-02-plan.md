---
name: step-02-plan
description: Phase de planification - concevoir la séquence de transformations
next_step: steps/step-03-execute.md
---

# Phase 2: Plan

**Role: ARCHITECT** - Design safe, incremental transformation sequence

---

<available_state>
From previous step:
- Assessment Report with code smells and metrics
- Test coverage status
- Refactoring objectives
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 📋 ORDER matters - some refactorings enable others
- 👣 SMALL steps - each transformation should be atomic
- ⏸️ CHECKPOINTS - plan where to verify
- 🔄 REVERSIBLE - each step should be easy to undo
- 🚫 FORBIDDEN: Planning transformations that change behavior
</mandatory_rules>

---

## Actions

### 2.1 Choisir les techniques appropriées

Pour chaque code smell identifié, sélectionner le refactoring adapté :

| Code Smell | Refactoring Technique | Risk |
|------------|----------------------|------|
| Long Method | Extract Method | Low |
| Duplicated Code | Extract Method/Class | Low-Medium |
| Long Parameter List | Introduce Parameter Object | Low |
| Feature Envy | Move Method | Medium |
| Data Clumps | Extract Class | Medium |
| Switch Statements | Replace with Polymorphism | High |
| Poor Naming | Rename | Low |

### 2.2 Ordonnancer les transformations

Ordre recommandé (du plus sûr au plus risqué) :

```
Level 1 - Preparations (Low Risk)
├── 1.1 Rename variables for clarity
├── 1.2 Extract variables for complex expressions
└── 1.3 Add missing types

Level 2 - Extractions (Low Risk)
├── 2.1 Extract methods from long functions
├── 2.2 Extract constants from magic numbers
└── 2.3 Extract interfaces if needed

Level 3 - Reorganization (Medium Risk)
├── 3.1 Move methods to appropriate classes
├── 3.2 Extract classes for new responsibilities
└── 3.3 Inline unnecessary indirections

Level 4 - Structural Changes (Higher Risk)
├── 4.1 Replace conditionals with polymorphism
├── 4.2 Introduce design patterns
└── 4.3 Change inheritance hierarchies
```

### 2.3 Définir les checkpoints

```markdown
### Checkpoints

After each transformation:
□ Tests pass
□ TypeScript compiles
□ Behavior unchanged

After Level 1:
□ All renames complete
□ Code more readable
□ Commit checkpoint

After Level 2:
□ All extractions complete
□ Functions < 50 lines
□ Commit checkpoint

After Level 3:
□ Better separation of concerns
□ Dependencies clearer
□ Commit checkpoint

After Level 4:
□ Final structure achieved
□ All objectives met
□ Final commit
```

### 2.4 Identifier les risques

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Run tests after each step |
| Breaking dependent code | Check usages before moving/renaming public APIs |
| Merge conflicts | Commit frequently, communicate with team |
| Performance regression | Profile before/after for critical code |

### 2.5 Préparer le plan détaillé

Pour chaque transformation, spécifier :
- **What**: Description précise du changement
- **Where**: Fichier(s) et lignes concernés
- **How**: Technique de refactoring
- **Verify**: Comment vérifier le succès

---

## Output de cette phase

```markdown
## Refactoring Plan

### Overview
- Total transformations: [X]
- Estimated commits: [X]
- Risk level: [Low/Medium/High]

### Transformation Sequence

#### Level 1: Preparations

**T1.1: Rename unclear variables**
- Where: `service.ts:25-50`
- Changes:
  - `x` → `orderTotal`
  - `temp` → `calculatedTax`
  - `d` → `orderDate`
- Verify: Tests pass, no behavior change

**T1.2: Extract complex expression**
- Where: `service.ts:45`
- Before: `const result = a * b + c - d / e`
- After:
  ```typescript
  const baseAmount = a * b;
  const adjustment = c - d / e;
  const result = baseAmount + adjustment;
  ```
- Verify: Tests pass, same output

#### Level 2: Extractions

**T2.1: Extract method `validateOrder`**
- Where: `service.ts:60-90`
- Extract: Lines 60-90 into new method
- Signature: `private validateOrder(order: Order): ValidationResult`
- Verify: Tests pass

**T2.2: Extract method `calculateTotals`**
- Where: `service.ts:95-130`
- Extract: Lines 95-130 into new method
- Signature: `private calculateTotals(items: OrderItem[]): Totals`
- Verify: Tests pass

#### Level 3: Reorganization

**T3.1: Move `calculateTax` to TaxService**
- From: `OrderService.calculateTax()`
- To: `TaxService.calculate()`
- Update: All callers
- Verify: Tests pass, all usages updated

### Checkpoint Schedule
| After | Commit Message | Verify |
|-------|---------------|--------|
| T1.2 | refactor: improve variable naming | ✓ |
| T2.2 | refactor: extract validation and calculation methods | ✓ |
| T3.1 | refactor: move tax calculation to TaxService | ✓ |

### Rollback Plan
If something goes wrong:
1. `git reset --hard HEAD~1` to undo last commit
2. Re-run tests to verify clean state
3. Analyze what went wrong
4. Adjust plan and retry

### Dependencies
Transformations that must be sequential:
- T1.1 must complete before T2.1 (uses renamed variables)
- T2.1 must complete before T3.1 (creates method to move)

### Estimated Timeline
- Level 1: [X] transformations
- Level 2: [X] transformations
- Level 3: [X] transformations
- Total: [X] transformations
```

---

→ **Next**: `step-03-execute.md` - Apply transformations
