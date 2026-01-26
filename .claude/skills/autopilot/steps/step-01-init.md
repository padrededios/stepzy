---
name: step-01-init
description: Phase d'initialisation - setup et compréhension du besoin
next_step: steps/step-02-plan.md
---

# Phase 1: Init

**Role: PROJECT MANAGER** - Setup the project and understand the requirement

---

<available_state>
From SKILL.md entry point:
- `{requirement}` - User's description of what they need
- `{model}` - Model to use (haiku/sonnet/opus)
- `{skip_phases}` - Phases to skip
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🌿 CREATE branch - never work on main
- 🔍 ANALYZE requirement - understand before acting
- 📊 ASSESS complexity - determines workflow depth
- 🏷️ CLASSIFY type - feature/improvement/bugfix/refactor
- 🚫 FORBIDDEN: Starting work without a dedicated branch
</mandatory_rules>

---

## Actions

### 1.1 Vérifier l'état Git

```bash
# Vérifier qu'on est dans un repo git
git status

# Vérifier la branche courante
git branch --show-current

# Vérifier qu'il n'y a pas de changements non commités
git status --porcelain
```

**Si changements non commités** :
```
⚠️ WARNING: Uncommitted changes detected.
Options:
1. Commit current changes first
2. Stash changes: git stash
3. Abort and handle manually

[ASK USER if not clear what to do]
```

### 1.2 Analyser le besoin

Parse `{requirement}` pour identifier :

| Aspect | Extraction |
|--------|------------|
| **Type** | feature / improvement / bugfix / refactor |
| **Scope** | backend / frontend / fullstack / infra |
| **Complexity** | simple / medium / complex |
| **Keywords** | Technologies, composants mentionnés |

```
[PARALLEL AGENTS - Requirement Analysis]

Agent 1 - Type Classifier:
=========================
Mission: Classify the requirement type
- Is it a new feature? → feature
- Is it improving existing? → improvement
- Is it fixing a bug? → bugfix
- Is it restructuring? → refactor

Agent 2 - Scope Analyzer:
========================
Mission: Determine scope
- Backend only? Frontend only? Both?
- Which modules/services affected?
- Database changes needed?

Agent 3 - Complexity Assessor:
=============================
Mission: Assess complexity
- Simple: 1-2 files, clear solution
- Medium: Multiple files, some design needed
- Complex: Architecture changes, many components
```

### 1.3 Explorer le codebase (si besoin)

```bash
# Structure du projet
ls -la

# README pour contexte
cat README.md 2>/dev/null || echo "No README"

# Tech stack
cat package.json | grep -A20 '"dependencies"' 2>/dev/null
```

### 1.4 Créer la branche

```bash
# Générer un nom de branche
# Format: {type}/{short-description}
# Ex: feature/notifications-push, fix/login-mobile, refactor/auth-service

# S'assurer d'être sur main/master et à jour
git checkout main 2>/dev/null || git checkout master
git pull origin $(git branch --show-current)

# Créer et checkout la nouvelle branche
git checkout -b {branch_name}
```

**Naming conventions** :
| Type | Prefix | Example |
|------|--------|---------|
| Feature | `feature/` | `feature/user-notifications` |
| Bug fix | `fix/` | `fix/login-button-mobile` |
| Improvement | `improve/` | `improve/dashboard-perf` |
| Refactor | `refactor/` | `refactor/auth-service` |

### 1.5 Déterminer le workflow

Basé sur l'analyse :

| Complexity | PRD | Spec | Full TDD |
|------------|-----|------|----------|
| Simple | ⏭️ Skip | ⏭️ Skip | Minimal |
| Medium | Optional | Recommended | Yes |
| Complex | Required | Required | Full |

| Type | Documentation | Tests |
|------|--------------|-------|
| Feature | PRD + Spec | Full TDD |
| Improvement | Spec only | Add tests |
| Bugfix | None | Regression test |
| Refactor | None | Preserve tests |

---

## Output de cette phase

```markdown
## Init Report

### Requirement
- **Original**: "{requirement}"
- **Type**: [feature/improvement/bugfix/refactor]
- **Scope**: [backend/frontend/fullstack]
- **Complexity**: [simple/medium/complex]

### Git Setup
- **Base branch**: main
- **New branch**: `{branch_name}`
- **Status**: ✅ Created and checked out

### Workflow Decision
Based on complexity assessment:
- PRD: [Required/Optional/Skip]
- Spec: [Required/Optional/Skip]
- TDD: [Full/Minimal/Tests only]

### Codebase Context
- **Stack**: [identified tech stack]
- **Related components**: [list]
- **Potential files to modify**: [list]

### Model Selection
- **Recommended**: {model} based on complexity
- **Reason**: [why this model]

### Ready for Planning
- [ ] Branch created
- [ ] Requirement understood
- [ ] Workflow determined
- [ ] Context gathered
```

---

## Decision Tree for Workflow

```
Requirement Type?
├─ Bugfix
│   └─ Skip to: Implement (with reproduction first)
├─ Refactor
│   └─ Skip to: Plan (ensure test coverage first)
├─ Improvement
│   ├─ Simple → Skip to: Implement
│   └─ Complex → Spec → Implement
└─ Feature
    ├─ Simple → Spec (light) → Implement
    ├─ Medium → Spec → Implement
    └─ Complex → PRD → Spec → Implement
```

---

→ **Next**: `step-02-plan.md` - Break down into atomic tasks
