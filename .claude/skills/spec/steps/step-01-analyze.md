---
name: step-01-analyze
description: Phase d'analyse - comprendre le PRD en profondeur
next_step: steps/step-02-architect.md
---

# Phase 1: Analyze

**Role: REQUIREMENTS ANALYST** - Understand the PRD completely

---

<available_state>
From SKILL.md entry point:
- `{prd_name}` - Name of the PRD
- `{prd_path}` - Path to `docs/prd/$ARGUMENTS.md`
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 📖 READ completely - don't skim, read everything
- 📋 EXTRACT requirements - user stories → technical needs
- 🔗 MAP dependencies - what needs what
- ❓ IDENTIFY gaps - what's missing from PRD
- 🚫 FORBIDDEN: Starting design without understanding PRD
</mandatory_rules>

---

## Actions

### 1.1 Vérifier que le PRD existe

```bash
# Vérifier l'existence du PRD
ls docs/prd/{prd_name}.md

# Si n'existe pas:
# "Le PRD n'existe pas. Exécutez d'abord: /prd {prd_name}"
```

### 1.2 Lire et analyser le PRD

```bash
Read docs/prd/{prd_name}.md
```

Extraire :
- Executive Summary
- Problem Statement
- Success Criteria
- User Stories (toutes)
- Technical Constraints
- Out of Scope
- Risks

### 1.3 Extraire les besoins techniques

Pour chaque User Story, identifier :

| US | Action Utilisateur | Besoin Backend | Besoin Frontend | Besoin Data |
|----|--------------------|----------------|-----------------|-------------|
| US-001 | [action] | [API needed] | [UI needed] | [model needed] |
| US-002 | [action] | [API] | [UI] | [data] |

### 1.4 Identifier les composants à spécifier

```
[PARALLEL AGENTS - Component Identification]

Agent 1 - API Requirements:
==========================
Mission: Extract all API needs
- List all endpoints needed
- Identify request/response formats
- Note authentication requirements
- List error cases

Agent 2 - Data Requirements:
===========================
Mission: Extract all data needs
- Identify entities/models needed
- List fields and their types
- Identify relationships
- Note indexes needed

Agent 3 - Security Requirements:
===============================
Mission: Extract security needs
- Authentication requirements
- Authorization rules (who can do what)
- Input validation needs
- Rate limiting needs

Agent 4 - Integration Requirements:
==================================
Mission: Extract integration needs
- External APIs to call
- Events to emit/consume
- Webhooks needed
- Third-party services
```

### 1.5 Identifier les gaps

Questions à poser si le PRD ne répond pas :
- [ ] Quel est le format exact des données ?
- [ ] Quelles sont les limites (pagination, rate limit) ?
- [ ] Comment gérer les erreurs edge case ?
- [ ] Quelle est la stratégie de rollback ?

---

## Output de cette phase

```markdown
## PRD Analysis Report

### PRD Summary
- Name: {prd_name}
- User Stories: [X]
- Success Criteria: [X]

### Extracted Requirements

#### API Endpoints Needed
| Endpoint | Method | Purpose | From US |
|----------|--------|---------|---------|
| /api/[resource] | POST | Create | US-001 |
| /api/[resource]/:id | GET | Read | US-002 |
| /api/[resource]/:id | PUT | Update | US-003 |
| /api/[resource]/:id | DELETE | Delete | US-004 |

#### Data Models Needed
| Model | Purpose | Key Fields | Relations |
|-------|---------|------------|-----------|
| [Model1] | [purpose] | [fields] | [relations] |

#### Security Requirements
- Authentication: [Required/Optional]
- Authorization: [Role-based/Resource-based]
- Validation: [fields to validate]

#### Technical Constraints (from PRD)
- [Constraint 1]
- [Constraint 2]

### Gaps Identified
| Gap | Impact | Assumption |
|-----|--------|------------|
| [Missing info] | [impact] | [our assumption] |

### Dependencies
- [ ] [Dependency 1]
- [ ] [Dependency 2]
```

---

→ **Next**: `step-02-architect.md` - Design technical solution
