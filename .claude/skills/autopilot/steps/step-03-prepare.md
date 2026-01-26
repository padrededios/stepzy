---
name: step-03-prepare
description: Phase de préparation - documentation et structure
next_step: steps/step-04-implement.md
skippable: true
skip_condition: "complexity == 'simple' || type == 'bugfix'"
---

# Phase 3: Prepare

**Role: ANALYST** - Create documentation and prepare file structure

---

<available_state>
From previous step:
- Planning Report with task breakdown
- Execution order defined
- Model strategy determined
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 📝 DOCUMENT proportionally - simple = light docs, complex = full docs
- 🏗️ STRUCTURE before code - create folders and empty files
- 🔗 VERIFY dependencies - ensure all needed packages exist
- ⏭️ SKIP if appropriate - bugfixes don't need PRD
- 🚫 FORBIDDEN: Over-documenting simple tasks
</mandatory_rules>

---

## Decision: Skip or Execute?

```
Type?
├─ bugfix → SKIP this phase
├─ refactor → SKIP this phase (maybe light spec)
├─ improvement
│   ├─ simple → SKIP
│   └─ medium/complex → Execute (Spec only)
└─ feature
    ├─ simple → Execute (Light spec)
    ├─ medium → Execute (Spec)
    └─ complex → Execute (PRD + Spec)
```

---

## Actions (if not skipped)

### 3.1 Documentation (selon complexité)

#### Pour features complexes: PRD + Spec

```bash
# Utiliser les skills existants
# Note: Ceci sera exécuté automatiquement

# 1. Créer le PRD
# [Invoke /prd skill with feature name]

# 2. Créer la Spec
# [Invoke /spec skill with feature name]
```

#### Pour features medium: Spec légère

```markdown
# Spec: {feature_name}

## Overview
[Brief description]

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/{feature} | Create |
| GET | /api/{feature}/:id | Get by ID |

## Data Model
```prisma
model {Feature} {
  id String @id @default(cuid())
  // fields
}
```

## Validation
- Field X: required, string, max 100
- Field Y: optional, number

## Files to Create
- backend/src/services/{feature}.service.ts
- backend/src/routes/{feature}.routes.ts
```

#### Pour features simples: Notes inline

Pas de fichier séparé, juste des commentaires dans le code.

### 3.2 Créer la structure de fichiers

```bash
# Créer les dossiers nécessaires
mkdir -p backend/src/services
mkdir -p backend/src/routes
mkdir -p backend/src/schemas
mkdir -p backend/tests/unit/{feature}
mkdir -p backend/tests/integration

# Créer les fichiers vides avec headers
```

```typescript
// backend/src/services/{feature}.service.ts
/**
 * {Feature} Service
 *
 * Handles business logic for {feature}
 * Created by Autopilot for: {requirement}
 */

// Implementation will follow TDD

export class {Feature}Service {
  // Methods to be implemented
}
```

### 3.3 Vérifier les dépendances

```bash
# Vérifier que les packages nécessaires sont installés
npm list zod prisma vitest 2>/dev/null

# Si manquant, noter pour installation
# (ne pas installer automatiquement sans vérification)
```

### 3.4 Préparer les tests skeleton

```typescript
// backend/tests/unit/{feature}/{feature}.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
// import { {feature}Service } from '@/services/{feature}.service';

describe('{Feature}Service', () => {
  // Tests will be added during implementation

  describe('create', () => {
    it.todo('should create with valid data');
    it.todo('should throw on invalid data');
  });

  describe('getById', () => {
    it.todo('should return existing item');
    it.todo('should return null for non-existing');
  });

  // ... more test skeletons based on plan
});
```

---

## Output de cette phase

```markdown
## Preparation Report

### Documentation Created
| Document | Path | Status |
|----------|------|--------|
| PRD | docs/prd/{feature}.md | ✅/⏭️ |
| Spec | docs/specs/{feature}.md | ✅/⏭️ |

### File Structure Created
```
backend/
├── src/
│   ├── services/{feature}.service.ts    ✅ (skeleton)
│   ├── routes/{feature}.routes.ts       ✅ (skeleton)
│   └── schemas/{feature}.schema.ts      ✅ (skeleton)
└── tests/
    ├── unit/{feature}/
    │   └── {feature}.service.test.ts    ✅ (skeleton)
    └── integration/
        └── {feature}.api.test.ts        ✅ (skeleton)
```

### Dependencies Check
| Package | Status |
|---------|--------|
| zod | ✅ Installed |
| prisma | ✅ Installed |
| vitest | ✅ Installed |

### Ready for Implementation
- [ ] Documentation ready (or skipped)
- [ ] File structure created
- [ ] Test skeletons in place
- [ ] Dependencies verified
```

---

## Skip Message (if skipped)

```markdown
## Phase 3: SKIPPED

**Reason**: {type} with {complexity} complexity doesn't require full documentation

**Alternative**: Implementation will include inline documentation

**Proceeding to**: Phase 4 (Implement)
```

---

→ **Next**: `step-04-implement.md` - TDD Implementation
