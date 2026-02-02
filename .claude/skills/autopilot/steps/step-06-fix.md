---
name: step-06-fix
description: Phase de correction - résoudre tous les problèmes
next_step: steps/step-05-validate.md
max_iterations: 3
---

# Phase 6: Fix

**Role: DEBUGGER** - Resolve all issues autonomously

---

<available_state>
From previous step:
- Validation Report with all issues
- Categorized problems (test/typescript/lint/build/runtime)
- Severity ratings
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🔄 ITERATE until fixed - keep trying until success
- 🎯 ONE issue at a time - fix, verify, move on
- 📊 PRIORITIZE by severity - High first
- 🧠 ANALYZE root cause - don't just patch symptoms
- ⏱️ LIMIT attempts - max {max_retries} per issue
- 🚫 FORBIDDEN: Giving up without exhausting options
</mandatory_rules>

---

## Fix Loop

```
┌─────────────────────────────────────────────────────────────┐
│                      FIX ITERATION                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Issues from Validation                                    │
│         │                                                   │
│         ▼                                                   │
│   ┌───────────────┐                                         │
│   │ Sort by       │                                         │
│   │ severity      │  High → Medium → Low                    │
│   └───────┬───────┘                                         │
│           │                                                 │
│           ▼                                                 │
│   For each issue:                                           │
│   ┌───────────────┐                                         │
│   │ 1. Analyze    │  Understand root cause                  │
│   └───────┬───────┘                                         │
│           │                                                 │
│           ▼                                                 │
│   ┌───────────────┐                                         │
│   │ 2. Fix        │  Apply minimal correction               │
│   └───────┬───────┘                                         │
│           │                                                 │
│           ▼                                                 │
│   ┌───────────────┐                                         │
│   │ 3. Verify     │  Run specific check                     │
│   └───────┬───────┘                                         │
│           │                                                 │
│       ┌───┴───┐                                             │
│       │       │                                             │
│     PASS    FAIL                                            │
│       │       │                                             │
│       ▼       ▼                                             │
│    Next    Retry (max {max_retries})                        │
│    issue      │                                             │
│               │                                             │
│           Still failing?                                    │
│               │                                             │
│               ▼                                             │
│         Escalate / Document                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Actions

### 6.1 Prioriser les issues

```markdown
## Issues Priority Queue

### Priority 1: High Severity (Blocking)
| # | Type | Issue | File |
|---|------|-------|------|
| 1 | Build | Cannot compile | src/x.ts |
| 2 | Test | Critical test failing | x.test.ts |

### Priority 2: Medium Severity
| # | Type | Issue | File |
|---|------|-------|------|
| 3 | TypeScript | Type error | src/y.ts |
| 4 | Lint | ESLint error | src/z.ts |

### Priority 3: Low Severity
| # | Type | Issue | File |
|---|------|-------|------|
| 5 | Lint | Warning | src/a.ts |
```

### 6.2 Pour chaque issue

#### Fix Pattern: Test Failure

```
1. Read the failing test
2. Read the tested code
3. Identify discrepancy:
   - Test expectation wrong? → Fix test
   - Implementation wrong? → Fix code
4. Run test again
5. If pass → commit fix
```

```bash
# Run specific test
npm test -- --testPathPattern="failing-test" --bail
```

#### Fix Pattern: TypeScript Error

```
1. Read the error message carefully
2. Go to the file:line indicated
3. Common fixes:
   - Missing type → Add type annotation
   - Type mismatch → Correct the type
   - Missing property → Add property or make optional
   - Cannot find module → Check import path
4. Run tsc again
```

```bash
# Check specific file
npx tsc --noEmit src/problematic-file.ts
```

#### Fix Pattern: Lint Error

```
1. Read the rule that's failing
2. Options:
   a. Fix the code to comply
   b. Disable rule for line (if justified)
   c. Configure rule differently
3. Run lint again
```

```bash
# Fix auto-fixable issues
npm run lint -- --fix

# Check specific file
npx eslint src/problematic-file.ts
```

#### Fix Pattern: Build Error

```
1. Read build output carefully
2. Common causes:
   - Import errors → Fix paths
   - Missing dependencies → npm install
   - Config issues → Check tsconfig/vite/webpack
3. Rebuild
```

```bash
# Clean and rebuild
rm -rf dist node_modules/.cache
npm run build
```

#### Fix Pattern: Runtime Error

```
1. Check logs/console output
2. Add debugging if needed
3. Common causes:
   - Undefined variable → Add null checks
   - API error → Check endpoint/data
   - Environment → Check env variables
4. Restart and test
```

### 6.3 Commit each fix

```bash
git add -A && git commit -m "$(cat <<'EOF'
fix({scope}): resolve {issue type}

- {What was wrong}
- {How it was fixed}

Issue: {description}

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### 6.4 Track fix attempts

```markdown
## Fix Attempts Log

| Issue | Attempt 1 | Attempt 2 | Attempt 3 | Result |
|-------|-----------|-----------|-----------|--------|
| TS error in x.ts | Fixed type | - | - | ✅ |
| Test failure | Fixed mock | Fixed assertion | - | ✅ |
| Build error | Fixed import | Added dep | Config fix | ✅ |
| Lint warning | Auto-fix | - | - | ✅ |
```

### 6.5 Escalation (si toujours en échec)

Après `{max_retries}` tentatives :

```markdown
## Escalation Required

### Issue that couldn't be resolved
- **Type**: [issue type]
- **Description**: [detailed description]
- **File**: [file:line]
- **Attempts made**:
  1. [What was tried]
  2. [What was tried]
  3. [What was tried]

### Analysis
- **Root cause hypothesis**: [what I think is wrong]
- **Blocking factor**: [why I couldn't fix it]

### Suggested solutions (need human input)
1. [Option A]
2. [Option B]
3. [Option C]

### Question for user
[Specific question to unblock]
```

---

## Output de cette phase

```markdown
## Fix Report

### Issues Resolved
| Issue | Type | Fix Applied | Attempts | Commit |
|-------|------|-------------|----------|--------|
| [issue] | TypeScript | [fix] | 1 | abc123 |
| [issue] | Test | [fix] | 2 | def456 |

### Issues Remaining
| Issue | Attempts | Status | Next Step |
|-------|----------|--------|-----------|
| [issue] | 3 | ❌ Failed | Escalated |

### Fix Commits
```
abc123 fix: resolve TypeScript error in service
def456 fix: correct test assertion
ghi789 fix: update import path
```

### Return to Validation
All fixable issues resolved. Returning to Validate phase.
```

---

→ **Next**: `step-05-validate.md` - Re-validate after fixes

(Loop continues until all checks pass or max iterations reached)
