---
name: step-02-prioritize
description: Phase de priorisation - classer les problèmes et planifier l'action
next_step: steps/step-03-clean.md
---

# Phase 2: Prioritize

**Role: STRATEGIST** - Rank issues by impact and create actionable plan

---

<available_state>
From previous step:
- Analysis Report with all identified issues
- Metrics per file
- Categorized issue list
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 📊 EVALUATE objectively - use consistent criteria
- ⚖️ BALANCE impact vs risk - quick wins first
- 🎯 GROUP logically - batch similar changes
- 📋 PLAN commits - one concern per commit
- 🚫 FORBIDDEN: Planning changes that alter behavior
</mandatory_rules>

---

## Actions

### 2.1 Évaluer chaque issue

Pour chaque problème identifié, évalue :

**Impact** (benefit of fixing):
- **High**: Améliore significativement la lisibilité/maintenabilité
- **Medium**: Amélioration modérée
- **Low**: Amélioration cosmétique

**Risk** (chance of breaking something):
- **High**: Touche à des interfaces publiques ou logique complexe
- **Medium**: Code utilisé à plusieurs endroits
- **Low**: Code isolé, bien testé

**Effort** (time to fix):
- **High**: Refactoring significatif nécessaire
- **Medium**: Changements modérés
- **Low**: Quick fix

### 2.2 Matrice de priorisation

```
                    Low Risk    Medium Risk    High Risk
                    ─────────   ───────────    ─────────
High Impact    │    DO FIRST      DO NEXT      CAREFUL
               │       ⬇️           ⬇️            ⬇️
Medium Impact  │    DO NEXT       LATER        SKIP?
               │       ⬇️           ⬇️            ⬇️
Low Impact     │    IF TIME       SKIP         SKIP
```

### 2.3 Grouper par batch de commits

Organise les changements en batches logiques :

```
Batch 1: Remove unused imports (Low Risk, Quick)
├── file1.ts: remove unused import A, B
├── file2.ts: remove unused import C
└── file3.ts: remove unused import D

Batch 2: Remove dead code (Low Risk, Medium Effort)
├── utils.ts: remove unused function X
└── helpers.ts: remove unused export Y

Batch 3: Fix naming (Low Risk, Medium Effort)
├── service.ts: rename x → userCount
└── handler.ts: rename temp → result

Batch 4: Replace any types (Medium Risk, Medium Effort)
├── types.ts: add proper typing
└── api.ts: replace any with Response

Batch 5: Extract duplicates (Medium Risk, Higher Effort)
├── Create shared utility
└── Replace duplicated code
```

### 2.4 Définir l'ordre d'exécution

1. **Quick Wins** (Low Risk + Low Effort) → Fait en premier
   - Unused imports
   - Commented code removal
   - TODO cleanup

2. **Safe Improvements** (Low Risk + Medium/High Impact)
   - Dead code removal (after usage verification)
   - Naming improvements (private variables)
   - Type improvements

3. **Careful Changes** (Medium Risk)
   - Duplication extraction
   - Structure refactoring
   - Public API type improvements

4. **Requires Review** (High Risk) → Marquer pour discussion
   - Interface changes
   - Complex refactoring
   - Behavior-adjacent changes

---

## Output de cette phase

```markdown
## Prioritization Report

### Quick Stats
- Total issues: [X]
- Will fix: [X]
- Skip (too risky): [X]
- Needs discussion: [X]

### Prioritized Issue List

| Priority | Category | File | Issue | Impact | Risk | Effort |
|----------|----------|------|-------|--------|------|--------|
| 1 | Imports | file1.ts | unused imports | Low | Low | Low |
| 2 | Dead Code | utils.ts | unused function | Med | Low | Low |
| 3 | Naming | api.ts | poor variable name | Med | Low | Med |
| ... | ... | ... | ... | ... | ... | ... |

### Execution Plan

#### Batch 1: Unused Imports (Commit: "chore: remove unused imports")
- [ ] file1.ts:1 - remove `import { unused } from 'pkg'`
- [ ] file2.ts:3 - remove `import { other } from 'other'`
Estimated changes: [X] files, [X] lines

#### Batch 2: Dead Code (Commit: "chore: remove dead code")
- [ ] utils.ts:50 - remove `export function unusedFn()`
- [ ] helpers.ts:20 - remove `export const UNUSED_CONST`
Estimated changes: [X] files, [X] lines

#### Batch 3: Naming (Commit: "refactor: improve variable naming")
- [ ] api.ts:10 - rename `x` to `responseCount`
- [ ] service.ts:25 - rename `temp` to `transformedData`
Estimated changes: [X] files, [X] lines

#### Batch 4: TypeScript (Commit: "refactor: improve type safety")
- [ ] types.ts:5 - replace `any` with `User`
- [ ] handler.ts:15 - add return type annotation
Estimated changes: [X] files, [X] lines

### Skipped Issues (Need Discussion)
| Issue | Reason |
|-------|--------|
| [...] | Changes public API |
| [...] | Risk of breaking dependents |

### Dependencies
- Batch 2 should come after Batch 1 (may reveal more dead code)
- Batch 4 may require Batch 3 first (better names help typing)
```

---

→ **Next**: `step-03-clean.md` - Apply improvements systematically
