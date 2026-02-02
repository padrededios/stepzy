---
name: step-02-analyze
description: Phase d'analyse - examen approfondi multi-dimensionnel
next_step: steps/step-03-evaluate.md
---

# Phase 2: Analyze

**Role: EXPERT ANALYST** - Deep systematic analysis across all dimensions

---

<available_state>
From previous step:
- Context Report with scope and purpose
- List of files to review
- Review strategy (focus areas)
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🔬 ANALYZE systematically - don't skip dimensions
- 📍 BE PRECISE - file:line for every finding
- 🎯 FOCUS on what matters - prioritize based on context
- 📝 DOCUMENT everything - even "looks good"
- 🚫 FORBIDDEN: Superficial scan without depth
</mandatory_rules>

---

## Actions

### 2.1 Lancer l'analyse parallèle

```
[PARALLEL AGENTS - Expert review mode]

Agent 1 - Architecture Reviewer:
===============================
Mission: Evaluate design and structure
- Does the code follow existing patterns?
- Is responsibility separation correct?
- Are dependencies appropriate?
- Is the abstraction level right?
- Any coupling concerns?

Check for:
- [ ] Consistent with existing architecture
- [ ] Single Responsibility Principle
- [ ] Dependency Injection where needed
- [ ] No circular dependencies
- [ ] Appropriate layering

Agent 2 - Security Auditor:
==========================
Mission: Find security vulnerabilities
- Input validation present?
- SQL/NoSQL injection possible?
- XSS vulnerabilities?
- Authentication/authorization correct?
- Secrets handling safe?
- Rate limiting needed?

Check for:
- [ ] All user inputs validated
- [ ] Parameterized queries used
- [ ] Output properly escaped
- [ ] Auth checks on all endpoints
- [ ] No hardcoded secrets
- [ ] Sensitive data not logged

Agent 3 - Performance Analyst:
=============================
Mission: Identify performance issues
- N+1 queries?
- Unnecessary iterations?
- Memory leaks possible?
- Blocking operations in async?
- Caching opportunities?

Check for:
- [ ] Efficient database queries
- [ ] Proper use of async/await
- [ ] No unbounded loops
- [ ] Pagination for large datasets
- [ ] Resource cleanup

Agent 4 - Test Reviewer:
=======================
Mission: Evaluate test quality
- Are tests present for new code?
- Are edge cases covered?
- Are tests meaningful or trivial?
- Is mocking appropriate?
- Can tests catch regressions?

Check for:
- [ ] Test coverage for new code
- [ ] Edge cases tested
- [ ] Error cases tested
- [ ] Tests are deterministic
- [ ] Tests are independent

Agent 5 - Code Quality Inspector:
================================
Mission: Assess maintainability
- Naming clear and consistent?
- Functions reasonable length?
- Code duplication?
- Error handling complete?
- Types correct and helpful?

Check for:
- [ ] Clear naming
- [ ] Functions < 50 lines
- [ ] No copy-paste code
- [ ] Proper error handling
- [ ] Strong typing
```

### 2.2 Analyse ligne par ligne

Pour chaque fichier modifié, examiner :

```typescript
// Recherche de patterns problématiques

// 🚫 Hardcoded secrets
const API_KEY = "sk-1234567890"; // BLOCKER

// 🚫 SQL Injection
const query = `SELECT * FROM users WHERE id = ${userId}`; // BLOCKER

// ⚠️ Missing null check
const name = user.profile.name; // WARNING: user.profile might be null

// ⚠️ Any type
function process(data: any) { } // WARNING: loses type safety

// 💡 Could be more readable
const x = arr.filter(i => i.active).map(i => i.id); // SUGGESTION: use meaningful names

// 📝 Formatting
import {a,b,c} from 'x' // NITPICK: spacing
```

### 2.3 Collecter les findings

Pour chaque issue trouvée :

```typescript
interface Finding {
  file: string;
  line: number;
  severity: 'blocker' | 'warning' | 'suggestion' | 'nitpick';
  category: 'security' | 'performance' | 'architecture' | 'testing' | 'quality';
  title: string;
  description: string;
  currentCode?: string;
  suggestedFix?: string;
}
```

---

## Output de cette phase

```markdown
## Analysis Report

### Files Analyzed
| File | Lines | Findings |
|------|-------|----------|
| src/services/user.ts | 150 | 3 |
| src/routes/user.ts | 80 | 2 |
| tests/user.test.ts | 200 | 1 |

### Findings by Category

#### Architecture
| File:Line | Severity | Finding |
|-----------|----------|---------|
| service.ts:25 | ⚠️ | Service directly calls DB, bypassing repository |

#### Security
| File:Line | Severity | Finding |
|-----------|----------|---------|
| routes.ts:42 | 🚫 | Missing authorization check |
| routes.ts:58 | ⚠️ | User input not validated |

#### Performance
| File:Line | Severity | Finding |
|-----------|----------|---------|
| service.ts:80 | ⚠️ | N+1 query in loop |

#### Testing
| File:Line | Severity | Finding |
|-----------|----------|---------|
| test.ts:50 | 💡 | Missing test for error case |

#### Code Quality
| File:Line | Severity | Finding |
|-----------|----------|---------|
| utils.ts:12 | 💡 | Variable name unclear |

### Detailed Findings

#### Finding 1: Missing Authorization Check
- **Location**: routes.ts:42
- **Severity**: 🚫 Blocker
- **Description**: Endpoint allows any authenticated user to access data
- **Current code**:
  ```typescript
  router.get('/users/:id', auth, async (req, res) => {
    const user = await userService.getById(req.params.id);
    res.json(user);
  });
  ```
- **Problem**: No check that user can access this specific user's data
- **Suggested fix**:
  ```typescript
  router.get('/users/:id', auth, async (req, res) => {
    if (req.user.id !== req.params.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const user = await userService.getById(req.params.id);
    res.json(user);
  });
  ```

[Continue for each finding...]
```

---

→ **Next**: `step-03-evaluate.md` - Form overall assessment
