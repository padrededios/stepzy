---
name: step-04-finalize
description: Phase de finalisation - plan de tests et génération de la spec
next_step: null
---

# Phase 4: Finalize

**Role: TECHNICAL WRITER** - Complete and document the specification

---

<available_state>
From previous steps:
- PRD Analysis
- Architecture Design
- Detailed API, Data, Validation specs
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🧪 TEST PLAN complete - unit, integration, E2E
- 📁 FILES listed - every file to create/modify
- ✅ VERIFY coherence - spec matches PRD
- 💾 SAVE correctly - docs/specs/{name}.md
- 🚫 FORBIDDEN: Incomplete specification
</mandatory_rules>

---

## Actions

### 4.1 Créer le plan de tests

```markdown
## Test Plan

### Unit Tests

#### {Feature}Service Tests
Location: `backend/tests/unit/{feature}/{feature}.service.test.ts`

| Test | Description |
|------|-------------|
| create - valid data | Should create and return {feature} |
| create - invalid data | Should throw ValidationError |
| create - duplicate | Should throw DuplicateError |
| getById - exists | Should return {feature} |
| getById - not found | Should return null |
| update - valid | Should update and return |
| update - not found | Should throw NotFoundError |
| update - unauthorized | Should throw ForbiddenError |
| delete - exists | Should delete successfully |
| delete - not found | Should throw NotFoundError |
| list - with pagination | Should return paginated results |
| list - with filters | Should filter correctly |

### Integration Tests

#### API Tests
Location: `backend/tests/integration/{feature}.api.test.ts`

| Test | Description |
|------|-------------|
| POST /api/{feature} - 201 | Create with valid data |
| POST /api/{feature} - 400 | Validation error |
| POST /api/{feature} - 401 | Without auth |
| POST /api/{feature} - 409 | Duplicate entry |
| GET /api/{feature}/:id - 200 | Get existing |
| GET /api/{feature}/:id - 404 | Not found |
| GET /api/{feature}/:id - 403 | Not owner |
| PUT /api/{feature}/:id - 200 | Update valid |
| PUT /api/{feature}/:id - 404 | Not found |
| DELETE /api/{feature}/:id - 204 | Delete existing |
| GET /api/{feature} - 200 | List with pagination |

### E2E Tests (if applicable)
Location: `e2e/tests/{feature}.e2e.test.ts`

| Scenario | Steps |
|----------|-------|
| Create and view | 1. Login 2. Create 3. View details |
| Update | 1. Login 2. Create 3. Edit 4. Verify |
| Delete | 1. Login 2. Create 3. Delete 4. Verify gone |

### Coverage Targets
| Type | Target |
|------|--------|
| Statements | ≥ 80% |
| Branches | ≥ 80% |
| Functions | ≥ 80% |
| Lines | ≥ 80% |
```

### 4.2 Lister les fichiers à créer/modifier

```markdown
## Files to Create/Modify

### New Files
```
backend/
├── src/
│   ├── services/{feature}.service.ts         # Business logic
│   ├── routes/{feature}.routes.ts            # API routes
│   ├── schemas/{feature}.schema.ts           # Zod validation
│   └── types/{feature}.types.ts              # TypeScript types
└── tests/
    ├── unit/{feature}/
    │   └── {feature}.service.test.ts         # Unit tests
    └── integration/
        └── {feature}.api.test.ts             # API tests
```

### Files to Modify
| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add {Feature} model |
| `backend/src/app.ts` | Register routes |
| `backend/src/types/index.ts` | Export new types |
```

### 4.3 Charger et remplir le template

```bash
Read .claude/skills/spec/template.md
```

### 4.4 Vérifier la cohérence avec le PRD

Checklist :
- [ ] Chaque User Story a un endpoint correspondant
- [ ] Les critères d'acceptation sont testables
- [ ] Les contraintes techniques sont respectées
- [ ] Les risques sont adressés

### 4.5 Générer la spec finale

```bash
mkdir -p docs/specs
Write docs/specs/{prd_name}.md
```

---

## Final Specification Document

```markdown
# Technical Specification: {Feature}

## Metadata
- **Date**: [YYYY-MM-DD]
- **PRD**: `docs/prd/{name}.md`
- **Author**: Claude (AI-assisted)
- **Version**: 1.0

---

## 1. Overview

### 1.1 Summary
[Technical summary of what will be built]

### 1.2 PRD Reference
- Document: `docs/prd/{name}.md`
- User Stories: US-001 through US-XXX

---

## 2. Architecture

### 2.1 Component Diagram
```
[ASCII diagram]
```

### 2.2 Components
[Component table]

### 2.3 Data Flow
[Sequence diagrams]

---

## 3. API Endpoints

[Full API documentation for each endpoint]

---

## 4. Database

### 4.1 Prisma Models
```prisma
[Schema]
```

### 4.2 Migrations
```bash
npx prisma migrate dev --name add_{feature}
```

---

## 5. Validation (Zod)

```typescript
[Schemas]
```

---

## 6. Error Handling

[Error codes table]

---

## 7. Security

### 7.1 Authentication
[Auth requirements]

### 7.2 Authorization
[Authz matrix]

### 7.3 Rate Limiting
[Limits]

---

## 8. Test Plan

[Full test plan]

---

## 9. Files to Create/Modify

[File list]

---

## 10. Review Checklist

- [ ] All endpoints documented
- [ ] All models complete
- [ ] Error handling specified
- [ ] Security requirements met
- [ ] Test plan complete
- [ ] Matches PRD requirements
```

---

## Final Report

```markdown
## 📋 Specification Complete

### Document
- **Path**: `docs/specs/{prd_name}.md`
- **Status**: ✅ Created

### Summary
- Endpoints: [X]
- Models: [X]
- Error codes: [X]
- Test cases: [X]

### PRD Coverage
- User Stories covered: [X]/[X]
- Acceptance criteria: [X]/[X]

### Next Steps
1. Review with team
2. Run `/dev {prd_name}` to implement

### Commands
```bash
# View the spec
cat docs/specs/{prd_name}.md

# Start implementation
/dev {prd_name}
```
```

---

## 🎉 Specification Complete

La spécification technique est prête :
- ✅ Architecture définie
- ✅ APIs documentées
- ✅ Modèles spécifiés
- ✅ Plan de tests inclus
- ✅ Prêt pour l'implémentation

→ **Session terminée**

Prochaine étape : `/dev {prd_name}` pour implémenter.
