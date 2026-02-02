---
name: step-01-context
description: Phase de contexte - comprendre ce qu'on review
next_step: steps/step-02-analyze.md
---

# Phase 1: Context

**Role: INVESTIGATOR** - Understand the full context before judging

---

<available_state>
From SKILL.md entry point:
- `{target}` - File, PR number, or branch name
- `{review_type}` - quick | standard | thorough
- `{focus_areas}` - security | performance | all
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 📖 READ before judging - understand the intent
- 🎯 IDENTIFY the scope - what exactly is being changed
- 🔗 FIND related context - tickets, docs, previous discussions
- ❓ NOTE questions - things to clarify with author
- 🚫 FORBIDDEN: Starting review without understanding purpose
</mandatory_rules>

---

## Actions

### 1.1 Identifier le type de target

**Si fichier** :
```bash
# Lire le fichier
Read [file_path]

# Comprendre le contexte du module
ls -la $(dirname [file_path])
```

**Si PR** :
```bash
# Récupérer les détails de la PR
gh pr view [number] --json title,body,files,additions,deletions

# Lire les commentaires existants
gh pr view [number] --comments

# Voir le diff
gh pr diff [number]
```

**Si branche** :
```bash
# Voir les commits
git log main..[branch] --oneline

# Voir le diff complet
git diff main...[branch]

# Lister les fichiers modifiés
git diff main...[branch] --name-only
```

### 1.2 Comprendre l'intention

Chercher la documentation :
- Description de PR/commit
- Ticket/issue associé
- PRD ou spec si mentionné
- Commentaires dans le code

Questions clés :
- **Quel problème est résolu ?**
- **Quelle approche a été choisie ?**
- **Y a-t-il des contraintes connues ?**

### 1.3 Identifier le scope

```markdown
### Files to Review
| File | Type | Changes |
|------|------|---------|
| src/services/user.ts | Modified | +50 / -20 |
| src/routes/user.ts | Modified | +30 / -10 |
| src/types/user.ts | New | +25 |
| tests/user.test.ts | Modified | +100 / -0 |

### Impacted Areas
- [ ] Backend API
- [ ] Database schema
- [ ] Frontend components
- [ ] Tests
- [ ] Configuration
```

### 1.4 Context Check

```markdown
### Related Resources
- Ticket: [link if found]
- PRD/Spec: [link if found]
- Related PRs: [links if found]
- Author notes: [summary]

### Questions Before Review
- [ ] Question 1?
- [ ] Question 2?
```

---

## Output de cette phase

```markdown
## Context Report

### Target
- Type: [file | PR | branch]
- Reference: [path/number/name]
- Author: [if applicable]

### Scope
- Files: [X] modified, [Y] new, [Z] deleted
- Lines: +[X] / -[Y]
- Areas: [backend/frontend/etc.]

### Purpose
[1-2 sentences describing what this change does]

### Related Context
- Ticket: [link or N/A]
- Documentation: [link or N/A]
- Dependencies: [list or none]

### Initial Questions
- [Any questions to keep in mind during review]

### Review Strategy
Based on scope and purpose, will focus on:
- [ ] Security (if handling user data/auth)
- [ ] Performance (if critical path)
- [ ] Correctness (always)
- [ ] Tests (always)
- [ ] Architecture (if new components)
```

---

→ **Next**: `step-02-analyze.md` - Deep analysis across dimensions
