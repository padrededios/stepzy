---
name: step-01-discover
description: Phase de découverte - comprendre le contexte et l'existant
next_step: steps/step-02-define.md
---

# Phase 1: Discover

**Role: RESEARCHER** - Understand the codebase and gather context

---

<available_state>
From SKILL.md entry point:
- `{feature_name}` - Name of the feature to document
- `{interactive}` - Whether to ask questions
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🔍 EXPLORE thoroughly - understand existing architecture
- 📋 IDENTIFY patterns - follow existing conventions
- 🔗 FIND related code - what already exists
- ❓ ASK if unclear - better to clarify than assume
- 🚫 FORBIDDEN: Starting PRD without understanding codebase
</mandatory_rules>

---

## Actions

### 1.1 Explorer le codebase

```
[PARALLEL AGENTS - Codebase Discovery]

Agent 1 - Architecture Explorer:
===============================
Mission: Understand the overall architecture
- Read main configuration files
- Identify tech stack (frontend, backend, database)
- Understand folder structure
- Find documentation

Agent 2 - Feature Scanner:
=========================
Mission: Find related existing features
- Search for similar functionality
- Identify patterns used
- Note existing components/services
- Find related APIs

Agent 3 - Convention Detector:
=============================
Mission: Identify coding conventions
- Naming conventions
- File organization
- Testing patterns
- Documentation style
```

### 1.2 Questions de clarification

Si `{interactive}` est true, pose des questions :

**Questions essentielles :**
1. **Quel problème cette feature résout-elle ?**
2. **Qui sont les utilisateurs cibles ?**
3. **Quelle est la priorité ? (MVP vs complet)**
4. **Y a-t-il des contraintes connues ?**

```
[ASK USER]
Question: "Pour mieux comprendre le besoin, peux-tu me décrire le problème que cette feature doit résoudre ?"

Question: "Qui sont les principaux utilisateurs de cette fonctionnalité ?"
```

### 1.3 Analyser l'existant

Cherche dans le codebase :
```bash
# Fonctionnalités similaires
grep -r "{feature_name}" --include="*.ts" --include="*.tsx"

# Documentation existante
ls docs/

# Modèles de données liés
grep -r "model" prisma/schema.prisma

# APIs existantes
grep -r "router" backend/src/routes/
```

### 1.4 Synthétiser le contexte

Collecte :
- Stack technique utilisé
- Patterns de code existants
- Fonctionnalités liées
- Contraintes identifiées

---

## Output de cette phase

```markdown
## Discovery Report

### Tech Stack
- Frontend: [React/Vue/etc.]
- Backend: [Express/Fastify/etc.]
- Database: [PostgreSQL/MongoDB/etc.]
- Auth: [JWT/Session/etc.]

### Related Features
| Feature | Location | Relevance |
|---------|----------|-----------|
| [existing feature] | [path] | [how it relates] |

### Patterns Identified
- API: REST/GraphQL
- State management: [pattern]
- Testing: [framework]
- File structure: [pattern]

### Existing Components to Reuse
- [ ] [Component/Service 1]
- [ ] [Component/Service 2]

### User Inputs (if interactive)
- Problem: [user's description]
- Users: [target users]
- Priority: [MVP/full]
- Constraints: [any mentioned]

### Initial Insights
- [Insight 1]
- [Insight 2]
- [Potential challenge]
```

---

→ **Next**: `step-02-define.md` - Define problem and success criteria
