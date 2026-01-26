---
name: step-02-implement
description: Phase d'implémentation - cycles TDD RED-GREEN-REFACTOR
next_step: steps/step-03-integrate.md
---

# Phase 2: Implement

**Role: TDD PRACTITIONER** - Strict RED-GREEN-REFACTOR cycles

---

<available_state>
From previous step:
- Feature backlog with priorities
- File structure created
- Dependencies verified
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🔴 WRITE test first - always, no exceptions
- 🟢 MINIMAL code - only what's needed to pass
- 🔁 ONE test at a time - never batch
- ✅ VERIFY each step - run tests after every change
- 🚫 FORBIDDEN: Implementation before test
</mandatory_rules>

---

## TDD Cycle Protocol

Pour CHAQUE fonctionnalité du backlog :

```
┌─────────────────────────────────────────────────┐
│  🔴 RED - Write Failing Test                    │
│                                                 │
│  1. Write ONE test for ONE behavior             │
│  2. Run test: npm test -- --testPathPattern=X   │
│  3. VERIFY: Test must FAIL                      │
│  4. Verify it fails for the RIGHT reason        │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  🟢 GREEN - Make Test Pass                      │
│                                                 │
│  1. Write MINIMAL code to pass the test         │
│  2. No extra features, no optimization          │
│  3. Run test: npm test -- --testPathPattern=X   │
│  4. VERIFY: Test must PASS                      │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  🔵 REFACTOR - Improve Code                     │
│                                                 │
│  1. Clean up the code (if needed)               │
│  2. Remove duplication                          │
│  3. Improve naming                              │
│  4. Run test: npm test                          │
│  5. VERIFY: All tests still PASS                │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
              Next test...
```

---

## Actions

### Pour chaque feature, suivre ce cycle :

#### Cycle TDD: Feature "Create"

**🔴 RED - Test 1: should create with valid data**

```typescript
// backend/tests/unit/{feature}/{feature}.service.test.ts

describe('{Feature}Service', () => {
  describe('create', () => {
    it('should create a new {feature} with valid data', async () => {
      // Arrange
      const input = {
        name: 'Test Name',
        description: 'Test Description',
      };

      // Act
      const result = await {feature}Service.create(input);

      // Assert
      expect(result).toMatchObject({
        id: expect.any(String),
        name: 'Test Name',
        description: 'Test Description',
        createdAt: expect.any(Date),
      });
    });
  });
});
```

```bash
# Run test - MUST FAIL
npm test -- --testPathPattern="{feature}" --bail
# Expected: FAIL - create method doesn't exist
```

**🟢 GREEN - Implement create**

```typescript
// backend/src/services/{feature}.service.ts

export class {Feature}Service {
  async create(input: Create{Feature}Input): Promise<{Feature}> {
    return await prisma.{feature}.create({
      data: input,
    });
  }
}
```

```bash
# Run test - MUST PASS
npm test -- --testPathPattern="{feature}" --bail
# Expected: PASS
```

**🔵 REFACTOR (if needed)**

```typescript
// Improve naming, extract types, etc.
// Then verify:
npm test -- --testPathPattern="{feature}"
# Expected: Still PASS
```

---

**🔴 RED - Test 2: should throw on invalid data**

```typescript
it('should throw ValidationError with invalid data', async () => {
  // Arrange
  const input = { name: '' }; // Invalid: empty name

  // Act & Assert
  await expect({feature}Service.create(input))
    .rejects.toThrow('Validation failed');
});
```

```bash
npm test -- --testPathPattern="{feature}" --bail
# Expected: FAIL - no validation yet
```

**🟢 GREEN**

```typescript
async create(input: Create{Feature}Input): Promise<{Feature}> {
  // Add validation
  const validated = {feature}Schema.parse(input);

  return await prisma.{feature}.create({
    data: validated,
  });
}
```

```bash
npm test -- --testPathPattern="{feature}" --bail
# Expected: PASS
```

---

### Continuer pour chaque test dans le backlog

Répéter le cycle RED → GREEN → REFACTOR pour :
- [ ] create - valid data
- [ ] create - invalid data
- [ ] create - duplicate handling
- [ ] read - by id
- [ ] read - not found
- [ ] update - valid data
- [ ] update - not found
- [ ] delete - existing
- [ ] delete - not found
- [ ] list - with pagination
- [ ] list - with filters

---

## Commit Strategy

Après chaque feature complète (tous ses tests) :

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat({feature}): add create functionality

- Add create method with validation
- Handle duplicate entries
- Add unit tests (5 passing)

TDD: RED → GREEN → REFACTOR complete

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Output de cette phase

```markdown
## Implementation Progress

### TDD Cycles Completed

| Feature | Tests Written | Tests Passing | Status |
|---------|---------------|---------------|--------|
| create | 3 | 3 | ✅ |
| read | 2 | 2 | ✅ |
| update | 3 | 3 | ✅ |
| delete | 2 | 2 | ✅ |
| list | 2 | 2 | ✅ |

### Code Coverage
- Statements: [X]%
- Branches: [X]%
- Functions: [X]%
- Lines: [X]%

### Commits Made
1. `feat({feature}): add create functionality`
2. `feat({feature}): add read functionality`
3. `feat({feature}): add update functionality`
4. `feat({feature}): add delete functionality`
5. `feat({feature}): add list functionality`

### Test Command
```bash
npm test -- --testPathPattern="{feature}"
# Result: 12 tests passing
```
```

---

→ **Next**: `step-03-integrate.md` - Integration tests
