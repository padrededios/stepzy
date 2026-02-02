---
name: step-04-implement
description: Phase d'implémentation - développement TDD étape par étape
next_step: steps/step-05-validate.md
---

# Phase 4: Implement

**Role: DEVELOPER** - Execute TDD implementation task by task

---

<available_state>
From previous step:
- Task list from Planning phase
- File structure created
- Documentation ready (or skipped)
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🔴 RED first - write failing test before implementation
- 🟢 GREEN minimal - only code needed to pass
- 🔵 REFACTOR after green - clean up, then verify
- 📦 ONE task at a time - complete before moving on
- 💾 COMMIT after each task - atomic commits
- 🚫 FORBIDDEN: Skipping tests or implementing without TDD
</mandatory_rules>

---

## Implementation Loop

```
For each task in task_list:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────┐                                            │
│  │ 1. TEST     │  Write failing test                        │
│  │    (RED)    │  npm test → FAIL expected                  │
│  └──────┬──────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ 2. IMPLEMENT│  Write minimal code                        │
│  │   (GREEN)   │  npm test → PASS expected                  │
│  └──────┬──────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ 3. REFACTOR │  Clean up code                             │
│  │   (BLUE)    │  npm test → PASS still                     │
│  └──────┬──────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ 4. COMMIT   │  Atomic commit for this task               │
│  │             │  git commit -m "feat: ..."                 │
│  └──────┬──────┘                                            │
│         │                                                   │
│         ▼                                                   │
│    Next task...                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Actions

### 4.1 Pour chaque tâche du plan

#### Étape 1: Écrire le test (RED)

```typescript
// Example: Task T4 - Create service

// backend/tests/unit/{feature}/{feature}.service.test.ts
describe('{Feature}Service', () => {
  describe('create', () => {
    it('should create a new {feature} with valid data', async () => {
      // Arrange
      const input = { name: 'Test', description: 'Description' };

      // Act
      const result = await {feature}Service.create(input);

      // Assert
      expect(result).toMatchObject({
        id: expect.any(String),
        name: 'Test',
        description: 'Description',
      });
    });
  });
});
```

```bash
# Exécuter - DOIT échouer
npm test -- --testPathPattern="{feature}" --bail
# Expected: FAIL (service doesn't exist yet)
```

#### Étape 2: Implémenter (GREEN)

```typescript
// backend/src/services/{feature}.service.ts
export class {Feature}Service {
  async create(input: Create{Feature}Input): Promise<{Feature}> {
    // Minimal implementation to pass the test
    return await prisma.{feature}.create({
      data: input,
    });
  }
}
```

```bash
# Exécuter - DOIT passer
npm test -- --testPathPattern="{feature}" --bail
# Expected: PASS
```

#### Étape 3: Refactor (BLUE)

```typescript
// Améliorer si nécessaire
// - Meilleurs noms
// - Extraire des helpers
// - Ajouter des types
```

```bash
# Vérifier que ça passe toujours
npm test -- --testPathPattern="{feature}"
# Expected: PASS
```

#### Étape 4: Commit

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat({feature}): add create functionality

- Add create method to {Feature}Service
- Add unit test for create
- Validate input with Zod schema

Task: T4/T[total]

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### 4.2 Tracking Progress

Maintenir un log de progression :

```markdown
## Implementation Progress

| Task | Description | Test | Code | Refactor | Commit |
|------|-------------|------|------|----------|--------|
| T1 | Prisma model | ⏭️ | ✅ | ✅ | abc123 |
| T2 | Migration | ⏭️ | ✅ | ✅ | def456 |
| T3 | Zod schemas | ✅ | ✅ | ✅ | ghi789 |
| T4 | Service create | ✅ | ✅ | ✅ | jkl012 |
| T5 | Service read | ✅ | ✅ | ⏳ | - |
| T6 | Routes | ⏳ | - | - | - |
| ... | ... | ... | ... | ... | ... |

Legend: ✅ Done | ⏳ In Progress | ⏭️ Skipped | ❌ Failed
```

### 4.3 Gestion des erreurs pendant l'implémentation

Si un test échoue de manière inattendue :

```
1. Analyser l'erreur
2. Est-ce une erreur de test ou de code ?
   ├─ Test incorrect → Corriger le test
   └─ Code incorrect → Corriger le code
3. Re-exécuter
4. Si toujours en échec après 2 tentatives → noter pour Phase 6 (Fix)
```

---

## Output de cette phase

```markdown
## Implementation Report

### Tasks Completed

| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| T1 | ✅ | abc123 | Prisma model added |
| T2 | ✅ | def456 | Migration successful |
| T3 | ✅ | ghi789 | Schemas validated |
| T4 | ✅ | jkl012 | Create working |
| T5 | ✅ | mno345 | Read working |
| T6 | ✅ | pqr678 | Routes complete |
| ... | ... | ... | ... |

### Test Results (so far)
```
Tests: X passed, Y failed, Z skipped
Coverage: XX%
```

### Code Written
- Files created: [X]
- Files modified: [X]
- Lines added: +[X]
- Lines removed: -[Y]

### Issues Noted (for Fix phase)
| Issue | Task | Severity |
|-------|------|----------|
| [issue] | T[X] | [H/M/L] |

### Commits Made
```
abc123 feat({feature}): add Prisma model
def456 feat({feature}): run migration
ghi789 feat({feature}): add Zod schemas
jkl012 feat({feature}): add create functionality
...
```
```

---

→ **Next**: `step-05-validate.md` - Full validation
