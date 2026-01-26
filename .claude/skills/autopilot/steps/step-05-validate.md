---
name: step-05-validate
description: Phase de validation - vérification complète
next_step: steps/step-06-fix.md
---

# Phase 5: Validate

**Role: QA ENGINEER** - Comprehensive verification of everything

---

<available_state>
From previous step:
- All tasks implemented
- Individual commits made
- Test results from implementation
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🧪 ALL tests must pass - no exceptions
- 📝 TypeScript must compile - zero errors
- 🔍 Lint must pass - code quality
- 🏃 Runtime check - actually run the code
- 📊 COLLECT all issues - don't stop at first error
- 🚫 FORBIDDEN: Proceeding to Finalize with any failures
</mandatory_rules>

---

## Validation Checklist

```
┌─────────────────────────────────────────────────────────────┐
│                    VALIDATION MATRIX                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. TESTS           npm test                    [ ] PASS    │
│                                                             │
│  2. TYPESCRIPT      npx tsc --noEmit            [ ] PASS    │
│                                                             │
│  3. LINT            npm run lint                [ ] PASS    │
│                                                             │
│  4. BUILD           npm run build               [ ] PASS    │
│                                                             │
│  5. RUNTIME         Start & test manually       [ ] PASS    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Result: ALL PASS → Finalize | ANY FAIL → Fix Phase
```

---

## Actions

### 5.1 Exécuter tous les tests

```bash
# Full test suite
npm test 2>&1 | tee /tmp/test-results.log

# Check result
if [ $? -eq 0 ]; then
  echo "✅ TESTS PASS"
else
  echo "❌ TESTS FAIL"
  # Extract failures for Fix phase
  grep -A5 "FAIL" /tmp/test-results.log
fi
```

```bash
# Coverage check
npm test -- --coverage 2>&1 | tee /tmp/coverage.log

# Extract coverage numbers
grep -E "^All files|Statements|Branches|Functions|Lines" /tmp/coverage.log
```

### 5.2 Vérifier TypeScript

```bash
# Type check without emitting
npx tsc --noEmit 2>&1 | tee /tmp/typescript-errors.log

# Count errors
ERROR_COUNT=$(grep -c "error TS" /tmp/typescript-errors.log || echo "0")
echo "TypeScript errors: $ERROR_COUNT"

if [ "$ERROR_COUNT" -eq "0" ]; then
  echo "✅ TYPESCRIPT PASS"
else
  echo "❌ TYPESCRIPT FAIL"
  cat /tmp/typescript-errors.log
fi
```

### 5.3 Vérifier le lint

```bash
# ESLint check
npm run lint 2>&1 | tee /tmp/lint-results.log

if [ $? -eq 0 ]; then
  echo "✅ LINT PASS"
else
  echo "❌ LINT FAIL"
  # Count issues
  grep -c "error\|warning" /tmp/lint-results.log
fi
```

### 5.4 Vérifier le build

```bash
# Build the project
npm run build 2>&1 | tee /tmp/build-results.log

if [ $? -eq 0 ]; then
  echo "✅ BUILD PASS"
else
  echo "❌ BUILD FAIL"
  tail -50 /tmp/build-results.log
fi
```

### 5.5 Vérification runtime (si applicable)

```bash
# Start server in background
npm run dev &
SERVER_PID=$!
sleep 5

# Test a basic endpoint
curl -s http://localhost:3000/health | grep -q "ok"
if [ $? -eq 0 ]; then
  echo "✅ RUNTIME PASS"
else
  echo "❌ RUNTIME FAIL"
fi

# Stop server
kill $SERVER_PID 2>/dev/null
```

### 5.6 Collecter tous les problèmes

```markdown
## Validation Issues Collected

| Category | Issue | File | Line | Severity |
|----------|-------|------|------|----------|
| Test | [failure message] | [file] | [line] | High |
| TypeScript | [TS error] | [file] | [line] | High |
| Lint | [lint error] | [file] | [line] | Medium |
| Build | [build error] | [file] | - | High |
| Runtime | [runtime error] | - | - | High |
```

---

## Output de cette phase

```markdown
## Validation Report

### Summary
| Check | Status | Issues |
|-------|--------|--------|
| Tests | ✅/❌ | [X] failures |
| TypeScript | ✅/❌ | [X] errors |
| Lint | ✅/❌ | [X] warnings |
| Build | ✅/❌ | [X] errors |
| Runtime | ✅/❌ | [X] errors |

### Test Results
```
Test Suites: X passed, Y failed
Tests: X passed, Y failed
Coverage: XX%
```

### TypeScript Errors
| Error | File | Line |
|-------|------|------|
| TS2345: ... | src/x.ts | 42 |

### Lint Issues
| Rule | File | Message |
|------|------|---------|
| no-unused-vars | src/x.ts | 'x' is unused |

### Build Errors
| Error | Details |
|-------|---------|
| [error] | [details] |

### Overall Status
- **Result**: ✅ ALL PASS / ❌ NEEDS FIX
- **Issues to fix**: [X]
- **Next step**: Finalize / Fix Phase
```

---

## Decision Point

```
All checks pass?
├─ YES → Proceed to step-07-finalize.md
└─ NO → Proceed to step-06-fix.md
```

---

→ **Next (if issues)**: `step-06-fix.md` - Fix all issues
→ **Next (if clean)**: `step-07-finalize.md` - Commit and complete
