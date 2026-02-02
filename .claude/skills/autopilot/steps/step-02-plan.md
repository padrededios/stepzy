---
name: step-02-plan
description: Phase de planification - découpage en tâches atomiques
next_step: steps/step-03-prepare.md
---

# Phase 2: Plan

**Role: ARCHITECT** - Break down into atomic, testable tasks

---

<available_state>
From previous step:
- Init Report with type, scope, complexity
- Branch created and checked out
- Workflow decision made
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🎯 ATOMIC tasks - each task should be completable independently
- ✅ TESTABLE outcomes - each task must have a verification method
- 📊 ORDERED by dependency - what must come before what
- ⏱️ REALISTIC scope - don't overcommit
- 🚫 FORBIDDEN: Tasks that are vague or unverifiable
</mandatory_rules>

---

## Actions

### 2.1 Décomposer le besoin

Transforme le besoin en tâches techniques :

```
[DECOMPOSITION PROCESS]

Requirement: "{requirement}"
        │
        ▼
┌───────────────────────────────────┐
│ 1. Identify Components            │
│    - What needs to exist?         │
│    - What needs to change?        │
└───────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────┐
│ 2. Define Data Flow               │
│    - Input → Processing → Output  │
│    - API contracts                │
└───────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────┐
│ 3. List Technical Tasks           │
│    - Models/Schemas               │
│    - Services/Logic               │
│    - Routes/Controllers           │
│    - UI Components                │
│    - Tests                        │
└───────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────┐
│ 4. Order by Dependency            │
│    - Data layer first             │
│    - Business logic second        │
│    - API/UI last                  │
└───────────────────────────────────┘
```

### 2.2 Créer les tâches atomiques

Pour chaque tâche, définir :

```markdown
### Task [N]: [Title]

**Description**: [What needs to be done]

**Files**:
- Create: [new files]
- Modify: [existing files]

**Depends on**: [previous task numbers]

**Acceptance criteria**:
- [ ] [Criterion 1 - verifiable]
- [ ] [Criterion 2 - verifiable]

**Verification**:
```bash
[Command to verify this task is done]
```
```

### 2.3 Template de plan

```markdown
## Implementation Plan

### Overview
- **Total tasks**: [X]
- **Estimated complexity**: [simple/medium/complex]
- **Dependencies**: [external deps if any]

### Task Breakdown

#### Phase A: Data Layer
| Task | Description | Files | Depends |
|------|-------------|-------|---------|
| T1 | Add Prisma model | schema.prisma | - |
| T2 | Create migration | - | T1 |
| T3 | Add Zod schemas | {feature}.schema.ts | T1 |

#### Phase B: Business Logic
| Task | Description | Files | Depends |
|------|-------------|-------|---------|
| T4 | Create service (TDD) | {feature}.service.ts | T3 |
| T5 | Add error handling | errors.ts | T4 |

#### Phase C: API Layer
| Task | Description | Files | Depends |
|------|-------------|-------|---------|
| T6 | Create routes | {feature}.routes.ts | T4, T5 |
| T7 | Add middleware | middleware/*.ts | T6 |
| T8 | Integration tests | {feature}.api.test.ts | T6 |

#### Phase D: Frontend (if applicable)
| Task | Description | Files | Depends |
|------|-------------|-------|---------|
| T9 | Create component | {Feature}.tsx | T6 |
| T10 | Add state management | store/*.ts | T9 |
| T11 | Component tests | {Feature}.test.tsx | T9 |

### Dependency Graph

```
T1 (Model)
  │
  ├──→ T2 (Migration)
  │
  └──→ T3 (Schemas)
         │
         └──→ T4 (Service)
                │
                ├──→ T5 (Errors)
                │
                └──→ T6 (Routes)
                       │
                       ├──→ T7 (Middleware)
                       │
                       ├──→ T8 (API Tests)
                       │
                       └──→ T9 (Frontend)
                              │
                              ├──→ T10 (State)
                              │
                              └──→ T11 (UI Tests)
```

### Verification Checkpoints

| After Task | Verification |
|------------|--------------|
| T2 | `npx prisma migrate dev` succeeds |
| T4 | Unit tests pass: `npm test -- {feature}` |
| T6 | API responds: `curl localhost:3000/api/{feature}` |
| T8 | Integration tests pass |
| T11 | All tests pass: `npm test` |
```

### 2.4 Estimer la complexité par tâche

| Task | Complexity | Model Recommendation |
|------|------------|---------------------|
| Simple (config, minor change) | Low | `haiku` |
| Standard (CRUD, component) | Medium | `sonnet` |
| Complex (architecture, algo) | High | `opus` |

### 2.5 Identifier les risques

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk 1] | H/M/L | H/M/L | [Plan] |
| [Risk 2] | H/M/L | H/M/L | [Plan] |

---

## Output de cette phase

```markdown
## Planning Report

### Summary
- **Requirement**: {requirement}
- **Total tasks**: [X]
- **Phases**: [X]
- **Risk level**: [Low/Medium/High]

### Task List

| # | Task | Phase | Complexity | Depends |
|---|------|-------|------------|---------|
| T1 | [...] | Data | Low | - |
| T2 | [...] | Data | Low | T1 |
| ... | ... | ... | ... | ... |

### Execution Order
1. T1 → T2 → T3 (Data Layer)
2. T4 → T5 (Business Logic)
3. T6 → T7 → T8 (API Layer)
4. T9 → T10 → T11 (Frontend)

### Checkpoints
| Checkpoint | Tasks | Verification |
|------------|-------|--------------|
| Data ready | T1-T3 | Migration + Types |
| Logic ready | T4-T5 | Unit tests pass |
| API ready | T6-T8 | Integration tests pass |
| Complete | T9-T11 | All tests pass |

### Risks Identified
| Risk | Mitigation |
|------|------------|
| [...] | [...] |

### Model Strategy (Optimized for Cost/Quality)

| Phase | Model | Reason |
|-------|-------|--------|
| PRD/Spec | `opus` | Réflexion produit et architecture complexe |
| Data Layer | `haiku` | Schemas simples, migrations |
| Business Logic | `sonnet` | Codage TDD standard |
| API/Routes | `sonnet` | Codage standard |
| Tests | `sonnet` | Écriture de tests |
| Debug/Fix | `sonnet` | Résolution de problèmes |
| Commits/Finalize | `haiku` | Tâches simples et répétitives |

**Économie estimée** : ~40% vs tout en opus, qualité préservée sur les phases critiques
```

---

→ **Next**: `step-03-prepare.md` - Prepare documentation and structure
