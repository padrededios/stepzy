---
name: step-02-architect
description: Phase d'architecture - concevoir la solution technique
next_step: steps/step-03-detail.md
---

# Phase 2: Architect

**Role: SYSTEM ARCHITECT** - Design the technical solution

---

<available_state>
From previous step:
- PRD Analysis Report
- Extracted requirements (APIs, Data, Security)
- Gaps and assumptions
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🏗️ DESIGN for clarity - diagrams > text
- 🔌 DEFINE interfaces - clear contracts between components
- 📊 DATA flow must be explicit - input → process → output
- 🎯 FOLLOW existing patterns - consistency with codebase
- 🚫 FORBIDDEN: Introducing new patterns without justification
</mandatory_rules>

---

## Actions

### 2.1 Explorer l'architecture existante

```
[PARALLEL AGENTS - Architecture Discovery]

Agent 1 - Backend Structure:
===========================
Mission: Understand backend architecture
- Folder structure
- Service patterns
- Middleware chain
- Error handling patterns

Agent 2 - Data Layer:
====================
Mission: Understand data architecture
- Prisma schema structure
- Existing models
- Naming conventions
- Relationship patterns

Agent 3 - API Patterns:
=====================
Mission: Understand API patterns
- Route organization
- Response format
- Error format
- Validation approach
```

### 2.2 Créer le diagramme d'architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Pages     │  │ Components  │  │    State/Store      │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────┘
          │                │                     │
          └────────────────┼─────────────────────┘
                           │ HTTP/WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Routes    │──│   Services  │──│    Repositories     │  │
│  │  (Express)  │  │  (Business) │  │     (Prisma)        │  │
│  └─────────────┘  └─────────────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│  ┌──────┴──────┐  ┌──────┴──────┐             │             │
│  │ Middleware  │  │  Validators │             │             │
│  │ (Auth,Logs) │  │   (Zod)     │             │             │
│  └─────────────┘  └─────────────┘             │             │
└───────────────────────────────────────────────┼─────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────┐
│                       Database                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    PostgreSQL                           ││
│  │   [Users] ←──→ [Resource] ←──→ [Related]               ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Définir les composants

| Composant | Responsabilité | Dépendances |
|-----------|----------------|-------------|
| `{Feature}Routes` | Gestion des requêtes HTTP | `{Feature}Service`, Auth middleware |
| `{Feature}Service` | Logique métier | Prisma, Validators |
| `{Feature}Schema` | Validation Zod | - |
| `{Feature}Types` | Types TypeScript | Prisma types |

### 2.4 Spécifier les flux de données

**Flux: Create {Feature}**
```
Client                 Routes              Service             Database
  │                      │                    │                    │
  │  POST /api/{feature} │                    │                    │
  │─────────────────────>│                    │                    │
  │                      │                    │                    │
  │                      │ auth middleware    │                    │
  │                      │───────────────────>│                    │
  │                      │                    │                    │
  │                      │ validate(body)     │                    │
  │                      │───────────────────>│                    │
  │                      │                    │                    │
  │                      │                    │ create(data)       │
  │                      │                    │───────────────────>│
  │                      │                    │                    │
  │                      │                    │      {feature}     │
  │                      │                    │<───────────────────│
  │                      │                    │                    │
  │  201 { data }        │                    │                    │
  │<─────────────────────│                    │                    │
```

### 2.5 Identifier les patterns à utiliser

| Pattern | Où | Pourquoi |
|---------|-----|----------|
| Repository | Data access | Abstraction DB |
| Service | Business logic | Séparation responsabilités |
| DTO | API | Validation entrée/sortie |
| Middleware | Auth/Logging | Cross-cutting concerns |

---

## Output de cette phase

```markdown
## Architecture Specification

### Component Diagram
```
[ASCII diagram here]
```

### Components
| Component | Type | Responsibility |
|-----------|------|----------------|
| {Feature}Routes | Route | HTTP handling |
| {Feature}Service | Service | Business logic |
| {Feature}Schema | Schema | Validation |

### Data Flow
#### Create Flow
```
[Sequence diagram]
```

#### Read Flow
```
[Sequence diagram]
```

### Patterns Used
| Pattern | Component | Justification |
|---------|-----------|---------------|
| [Pattern] | [Where] | [Why] |

### Integration Points
| System | Type | Purpose |
|--------|------|---------|
| [External] | [API/Event] | [Purpose] |

### Non-Functional Requirements
- Response time: < 200ms
- Throughput: > 100 req/s
- Availability: 99.9%
```

---

→ **Next**: `step-03-detail.md` - Detail APIs, data models, validation
