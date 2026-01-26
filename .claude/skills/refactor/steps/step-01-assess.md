---
name: step-01-assess
description: Phase d'évaluation - comprendre quoi refactorer et pourquoi
next_step: steps/step-02-plan.md
---

# Phase 1: Assess

**Role: ANALYST** - Understand current state and define objectives

---

<available_state>
From SKILL.md entry point:
- `{target}` - File(s) or pattern to refactor
- `{refactor_type}` - Specific refactoring type if specified
- `{safe_mode}` - If true, extra careful verification
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🔍 ANALYZE thoroughly - understand before changing
- 🧪 CHECK test coverage - never refactor untested code
- 📊 MEASURE current state - establish baseline metrics
- 🎯 DEFINE objectives - what "better" means for this code
- 🚫 FORBIDDEN: Starting refactoring without test coverage
</mandatory_rules>

---

## Actions

### 1.1 Analyser le code actuel

```
[PARALLEL AGENTS - Assessment mode]

Agent 1 - Code Smell Detector:
=============================
Mission: Identify all code smells
- Long Method (>50 lines)
- Large Class (>300 lines)
- Long Parameter List (>4 params)
- Duplicated Code
- Feature Envy
- Data Clumps
- Primitive Obsession
- Switch Statements
- Parallel Inheritance
- Lazy Class
- Speculative Generality
- Temporary Field
- Message Chains
- Middle Man
- Inappropriate Intimacy
- Alternative Classes with Different Interfaces
- Incomplete Library Class
- Data Class
- Refused Bequest
- Comments (as deodorant)

Agent 2 - Metrics Calculator:
============================
Mission: Measure code quality metrics
- Lines of Code (LOC)
- Cyclomatic Complexity
- Cognitive Complexity
- Function/Method count
- Max function length
- Average function length
- Nesting depth
- Coupling (afferent/efferent)
- Cohesion
- Any type count

Agent 3 - Dependency Mapper:
===========================
Mission: Map dependencies and coupling
- What does this code depend on?
- What depends on this code?
- Internal dependencies
- External dependencies
- Circular dependencies?
- Coupling score

Agent 4 - Test Coverage Analyzer:
================================
Mission: Analyze test coverage
- Overall coverage %
- Function coverage
- Branch coverage
- Line coverage
- Uncovered critical paths
- Test quality assessment
```

### 1.2 Vérifier la couverture de tests

```bash
# Exécuter les tests avec couverture
npm test -- --coverage --collectCoverageFrom="{target}"

# Vérifier le résultat
# Coverage minimum recommandé: 80%
```

**Si couverture insuffisante** :
```
⚠️ STOP: Coverage < 80%

Before refactoring, add tests for:
- [ ] Untested function A
- [ ] Untested branch in function B
- [ ] Edge case in function C

Refactoring untested code is dangerous!
```

### 1.3 Identifier les code smells

| Code Smell | Location | Severity | Description |
|------------|----------|----------|-------------|
| Long Method | file:25-120 | High | 95 lines, does too much |
| Data Clumps | file:30,45,60 | Medium | Same 3 params repeated |
| Feature Envy | file:80 | Medium | Method uses other class's data more |

### 1.4 Définir les objectifs

```markdown
### Refactoring Objectives

#### Primary Goals
- [ ] Reduce function length to <50 lines
- [ ] Improve naming clarity
- [ ] Extract reusable logic

#### Secondary Goals
- [ ] Improve type safety
- [ ] Reduce complexity
- [ ] Better separation of concerns

#### Constraints
- [ ] No behavior change
- [ ] Maintain public API
- [ ] Keep backward compatibility
```

---

## Output de cette phase

```markdown
## Assessment Report

### Target
- Files: [list]
- Lines: [total]
- Functions: [count]

### Test Coverage
| Metric | Current | Required |
|--------|---------|----------|
| Line Coverage | X% | 80% |
| Branch Coverage | X% | 80% |
| Function Coverage | X% | 80% |

**Status**: ✅ Ready to refactor / ❌ Need more tests first

### Current Metrics
| Metric | Value | Target |
|--------|-------|--------|
| Total LOC | X | <Y |
| Max Function Length | X | <50 |
| Cyclomatic Complexity | X | <10 |
| Any Count | X | 0 |

### Code Smells Identified
| Smell | Count | Severity | Priority |
|-------|-------|----------|----------|
| Long Method | X | High | 1 |
| Duplicated Code | X | High | 2 |
| Poor Naming | X | Medium | 3 |

### Refactoring Objectives
1. [Primary objective 1]
2. [Primary objective 2]
3. [Secondary objective 1]

### Dependencies
- Used by: [X] files
- Uses: [Y] modules
- Risk level: [Low/Medium/High]

### Recommendation
[Go ahead / Need tests first / Not recommended]
```

---

→ **Next**: `step-02-plan.md` - Design transformation sequence
