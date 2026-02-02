---
name: step-04-report
description: Phase de rapport - délivrer un feedback actionnable
next_step: null
---

# Phase 4: Report

**Role: COMMUNICATOR** - Deliver clear, actionable, and professional feedback

---

<available_state>
From previous step:
- Evaluation Report with verdict
- Prioritized findings
- Quality scores
- Positive feedback points
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 📋 STRUCTURE clearly - easy to scan and act upon
- 🎯 LEAD with verdict - don't bury the decision
- ✍️ PROFESSIONAL tone - respectful and constructive
- 📎 INCLUDE code - examples make feedback actionable
- 🚫 FORBIDDEN: Leaving author unsure of next steps
</mandatory_rules>

---

## Final Report Template

```markdown
## 📋 Code Review: [Target]

### 🎯 Verdict: [✅ APPROVED / ⚠️ CHANGES REQUESTED / ❌ BLOCKED]

[One sentence summary of the decision]

---

### 📊 Summary

| Metric | Value |
|--------|-------|
| Files reviewed | [X] |
| Lines changed | +[X] / -[Y] |
| 🚫 Blockers | [X] |
| ⚠️ Warnings | [X] |
| 💡 Suggestions | [X] |

---

### ✅ What's Good

Before diving into issues, here's what's well done:

1. **[Good thing 1]** - [brief explanation]
2. **[Good thing 2]** - [brief explanation]
3. **[Good thing 3]** - [brief explanation]

---

### 🚫 Blockers (Must Fix)

These issues must be resolved before merge:

#### 1. [Issue Title]
📍 `file.ts:42`

**Problem**: [Clear description of the issue]

**Current**:
```typescript
// Current problematic code
```

**Suggested**:
```typescript
// Fixed code
```

**Why it matters**: [Impact/risk if not fixed]

---

### ⚠️ Warnings (Should Fix)

These issues should be addressed:

#### 1. [Issue Title]
📍 `file.ts:58`

**Issue**: [Description]

**Recommendation**:
```typescript
// Suggested improvement
```

---

### 💡 Suggestions (Optional)

Consider these improvements:

1. 📍 `file.ts:75` - [Suggestion]
2. 📍 `file.ts:90` - [Suggestion]
3. 📍 `file.ts:105` - [Suggestion]

---

### 📝 Nitpicks

Minor style/formatting issues (fix if convenient):

- `file.ts:12` - [nitpick]
- `file.ts:25` - [nitpick]

---

### ❓ Questions

- [ ] [Question about a design decision]
- [ ] [Request for clarification]

---

### 📋 Action Checklist

Before re-requesting review:
- [ ] Fix blocker: [description]
- [ ] Fix blocker: [description]
- [ ] Address warning: [description]
- [ ] Respond to questions above

---

### 📈 Quality Assessment

| Dimension | Score | Notes |
|-----------|-------|-------|
| Security | ⭐⭐⭐⭐☆ | [note] |
| Performance | ⭐⭐⭐⭐⭐ | [note] |
| Code Quality | ⭐⭐⭐⭐☆ | [note] |
| Testing | ⭐⭐⭐☆☆ | [note] |
| Architecture | ⭐⭐⭐⭐☆ | [note] |

---

_Review by Claude | [Date]_
```

---

## Actions

### 4.1 Générer le rapport

Compile toutes les informations des phases précédentes dans le format final.

### 4.2 Poster sur PR (si applicable)

```bash
# Si c'est une PR GitHub
gh pr review [number] --comment --body-file /tmp/review-report.md

# Ou pour bloquer/approuver
gh pr review [number] --request-changes --body-file /tmp/review-report.md
gh pr review [number] --approve --body-file /tmp/review-report.md
```

### 4.3 Commenter les lignes spécifiques (optionnel)

Pour les issues importantes, ajouter des commentaires inline :

```bash
# Commenter une ligne spécifique
gh api repos/{owner}/{repo}/pulls/{pr}/comments \
  -f body="[Comment]" \
  -f commit_id="[sha]" \
  -f path="[file]" \
  -f line=[line_number]
```

---

## Adapter le ton selon le verdict

### ✅ Approved
```
Looks good! Just a few minor suggestions but nothing blocking.
Feel free to merge after addressing them or ship as-is.
```

### ⚠️ Changes Requested
```
Good work overall, but there are a few issues that should be addressed
before merging. The blockers are security-related so they need attention.
Let me know if you have questions about any of the feedback.
```

### ❌ Blocked
```
This PR has critical issues that need to be fixed. The main concerns are
[X, Y, Z]. I've provided detailed suggestions for each. Happy to discuss
if you'd like to talk through the solutions.
```

---

## 🎉 Review Complete

La review a été effectuée de manière :
- ✅ Approfondie
- ✅ Constructive
- ✅ Actionnable
- ✅ Professionnelle

→ **Session terminée**
