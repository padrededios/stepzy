---
name: step-01-prepare
description: Phase de préparation - comprendre la spec et préparer la structure
next_step: steps/step-02-implement.md
---

# Phase 1: Prepare

**Role: PLANNER** - Understand the specification and prepare the implementation

---

<available_state>
From SKILL.md entry point:
- `{spec_name}` - Name of the specification
- `{spec_path}` - Path to `docs/specs/$ARGUMENTS.md`
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 📖 READ the full spec - don't start without understanding
- 📋 LIST all features - know the complete scope
- 🏗️ CREATE structure - prepare files before coding
- 🧪 VERIFY prerequisites - ensure dependencies exist
- 🚫 FORBIDDEN: Starting implementation without reading spec
</mandatory_rules>

---

## Actions

### 1.1 Vérifier les prérequis

```bash
# Vérifier que la spec existe
ls docs/specs/{spec_name}.md

# Si n'existe pas:
# "La spec n'existe pas. Exécutez d'abord: /spec {spec_name}"
```

### 1.2 Lire et analyser la spécification

```
[PARALLEL AGENTS - Spec Analysis]

Agent 1 - Feature Extractor:
===========================
Mission: Extract all features to implement
- List every user story
- Identify acceptance criteria
- Note the test plan from spec
- Create feature backlog

Agent 2 - Architecture Analyzer:
===============================
Mission: Understand the technical design
- Read API endpoints
- Understand data models
- Note validation schemas
- Identify dependencies

Agent 3 - File Mapper:
=====================
Mission: Map files to create/modify
- New services needed
- New routes needed
- Schema changes needed
- Test files needed
```

### 1.3 Créer le backlog de features

```markdown
### Feature Backlog

| # | Feature | User Story | Tests Needed | Priority |
|---|---------|------------|--------------|----------|
| 1 | Create | US-001 | 4 | High |
| 2 | Read | US-002 | 3 | High |
| 3 | Update | US-003 | 4 | Medium |
| 4 | Delete | US-004 | 2 | Medium |
| 5 | List | US-005 | 3 | Low |
```

### 1.4 Créer la structure de fichiers

```bash
# Créer les dossiers
mkdir -p backend/src/services
mkdir -p backend/src/routes
mkdir -p backend/src/schemas
mkdir -p backend/tests/unit/{feature}
mkdir -p backend/tests/integration

# Créer les fichiers vides
touch backend/src/services/{feature}.service.ts
touch backend/src/routes/{feature}.routes.ts
touch backend/src/schemas/{feature}.schema.ts
touch backend/tests/unit/{feature}/{feature}.service.test.ts
touch backend/tests/integration/{feature}.api.test.ts
```

### 1.5 Préparer les imports de base

```typescript
// backend/src/services/{feature}.service.ts
import { prisma } from '../lib/prisma';

// Export vide pour commencer
export class {Feature}Service {
  // TDD: features will be added one by one
}

export const {feature}Service = new {Feature}Service();
```

```typescript
// backend/tests/unit/{feature}/{feature}.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { {feature}Service } from '../../../src/services/{feature}.service';

describe('{Feature}Service', () => {
  // Tests will be added following TDD
});
```

---

## Output de cette phase

```markdown
## Preparation Report

### Spec Analysis
- Spec: `docs/specs/{spec_name}.md`
- Status: ✅ Found and analyzed

### Features to Implement
| Feature | Tests | Priority |
|---------|-------|----------|
| [feature 1] | [X] | High |
| [feature 2] | [X] | High |
| [feature 3] | [X] | Medium |

### Files Created
- [ ] backend/src/services/{feature}.service.ts
- [ ] backend/src/routes/{feature}.routes.ts
- [ ] backend/tests/unit/{feature}/{feature}.service.test.ts
- [ ] backend/tests/integration/{feature}.api.test.ts

### Dependencies Verified
- [ ] Prisma schema has required models
- [ ] Required packages installed
- [ ] Base configuration present

### Ready for Implementation
- Total features: [X]
- Total tests to write: [X]
- Estimated TDD cycles: [X]
```

---

→ **Next**: `step-02-implement.md` - Begin TDD implementation
