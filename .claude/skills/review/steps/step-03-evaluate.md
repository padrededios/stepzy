---
name: step-03-evaluate
description: Phase d'évaluation - former un jugement global
next_step: steps/step-04-report.md
---

# Phase 3: Evaluate

**Role: JUDGE** - Form overall assessment and prioritize findings

---

<available_state>
From previous step:
- Analysis Report with all findings
- Categorized issues by severity and type
- Detailed descriptions with code examples
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- ⚖️ BE FAIR - consider context and constraints
- 🎯 PRIORITIZE clearly - blockers must be obvious
- 👍 ACKNOWLEDGE good work - balance negative with positive
- 🤝 BE CONSTRUCTIVE - goal is improvement, not criticism
- 🚫 FORBIDDEN: Being harsh or unconstructive
</mandatory_rules>

---

## Actions

### 3.1 Classer les findings par priorité

**Blockers** (Must be fixed before merge):
```
Priority 1: Security vulnerabilities
Priority 2: Data corruption risks
Priority 3: Breaking changes without migration
Priority 4: Critical bugs
```

**Warnings** (Should be fixed, may accept with justification):
```
Priority 5: Performance issues
Priority 6: Missing tests for critical paths
Priority 7: Poor error handling
Priority 8: Type safety issues
```

**Suggestions** (Nice to have, author's choice):
```
Priority 9: Code readability improvements
Priority 10: Additional tests
Priority 11: Better naming
Priority 12: Documentation
```

### 3.2 Déterminer le verdict

```
Decision Tree:

Has Blockers?
├─ Yes → ❌ Request Changes (must fix blockers)
└─ No → Has Critical Warnings?
         ├─ Yes (many/severe) → ⚠️ Request Changes (should fix)
         └─ No/Few → ✅ Approve (with optional suggestions)
```

### 3.3 Identifier les points positifs

Ne pas oublier de noter ce qui est bien fait :
- Bonne architecture
- Code propre et lisible
- Tests complets
- Bonne documentation
- Gestion d'erreurs appropriée
- Patterns intelligents

### 3.4 Formuler le feedback

Pour chaque finding, s'assurer que le feedback est :

**Spécifique** :
```
❌ "This could be improved"
✅ "Consider using `Array.find()` instead of `filter()[0]` for single item lookup (line 42)"
```

**Actionnable** :
```
❌ "This is not secure"
✅ "Add input validation using Zod schema before processing (see suggested code above)"
```

**Constructif** :
```
❌ "Why did you do it this way?"
✅ "Have you considered using X pattern? It would help with Y because Z"
```

### 3.5 Évaluation globale

```markdown
### Overall Assessment

**Code Quality**: [⭐⭐⭐⭐☆] 4/5
- Architecture: Good / Average / Needs Work
- Security: Good / Average / Needs Work
- Performance: Good / Average / Needs Work
- Testing: Good / Average / Needs Work
- Maintainability: Good / Average / Needs Work

**Risk Level**: [Low / Medium / High]
- Breaking changes: Yes / No
- Security sensitive: Yes / No
- Performance critical: Yes / No

**Confidence Level**: [High / Medium / Low]
- Understood the code: Yes / Partially / No
- Edge cases considered: Yes / Partially / No
```

---

## Output de cette phase

```markdown
## Evaluation Report

### Verdict
**Decision**: ✅ Approved / ⚠️ Changes Requested / ❌ Blocked

**Reasoning**: [1-2 sentences explaining the decision]

### Finding Summary
| Severity | Count | Action Required |
|----------|-------|-----------------|
| 🚫 Blocker | [X] | Must fix |
| ⚠️ Warning | [X] | Should fix |
| 💡 Suggestion | [X] | Optional |
| 📝 Nitpick | [X] | Optional |

### Prioritized Action Items

#### Must Fix (Blockers)
1. **[Title]** - file:line
   - Why: [impact]
   - How: [solution]

#### Should Fix (Warnings)
1. **[Title]** - file:line
   - Why: [impact]
   - How: [solution]

#### Consider (Suggestions)
1. **[Title]** - file:line
   - Benefit: [why it would be better]

### What's Well Done 👍
1. [Positive point 1]
2. [Positive point 2]
3. [Positive point 3]

### Questions for Discussion
- [Any design decisions to discuss?]
- [Any clarifications needed?]

### Quality Scores
| Dimension | Score | Notes |
|-----------|-------|-------|
| Architecture | [X]/5 | [comment] |
| Security | [X]/5 | [comment] |
| Performance | [X]/5 | [comment] |
| Testing | [X]/5 | [comment] |
| Code Quality | [X]/5 | [comment] |
| **Overall** | [X]/5 | |
```

---

→ **Next**: `step-04-report.md` - Generate final report
