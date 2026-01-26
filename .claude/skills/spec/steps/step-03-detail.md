---
name: step-03-detail
description: Phase de détail - APIs, modèles de données et validations
next_step: steps/step-04-finalize.md
---

# Phase 3: Detail

**Role: API DESIGNER** - Specify APIs, data models, and validations in detail

---

<available_state>
From previous step:
- Architecture diagram
- Component definitions
- Data flow diagrams
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 📡 API fully documented - request, response, errors
- 💾 DATA models complete - all fields, types, constraints
- ✅ VALIDATION explicit - Zod schemas ready to use
- ❌ ERRORS enumerated - all error codes and messages
- 🚫 FORBIDDEN: Incomplete endpoint documentation
</mandatory_rules>

---

## Actions

### 3.1 Documenter les endpoints API

Pour CHAQUE endpoint :

```markdown
### POST /api/{feature}

**Description**: Crée un nouveau {feature}

**Authentication**: Required (Bearer token)

**Headers**:
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer {token} |
| Content-Type | Yes | application/json |

**Request Body**:
```json
{
  "name": "string (required, 1-100 chars)",
  "description": "string (optional, max 500 chars)",
  "type": "enum: 'type1' | 'type2' | 'type3'",
  "metadata": {
    "key": "value (optional)"
  }
}
```

**Response 201 (Created)**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "name": "string",
    "description": "string | null",
    "type": "string",
    "metadata": {},
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

**Response 400 (Validation Error)**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      }
    ]
  }
}
```

**Response 401 (Unauthorized)**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Response 409 (Conflict)**:
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_ENTRY",
    "message": "A {feature} with this name already exists"
  }
}
```
```

### 3.2 Définir les modèles Prisma

```prisma
// prisma/schema.prisma

model {Feature} {
  id          String   @id @default(cuid())
  name        String
  description String?
  type        {Feature}Type
  metadata    Json     @default("{}")

  // Relations
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Indexes
  @@index([userId])
  @@index([type])
  @@index([createdAt])

  // Constraints
  @@unique([userId, name])
}

enum {Feature}Type {
  TYPE1
  TYPE2
  TYPE3
}
```

### 3.3 Créer les schémas de validation Zod

```typescript
// backend/src/schemas/{feature}.schema.ts

import { z } from 'zod';

// Create schema
export const create{Feature}Schema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  type: z.enum(['type1', 'type2', 'type3']),
  metadata: z.record(z.unknown()).optional(),
});

// Update schema (partial)
export const update{Feature}Schema = create{Feature}Schema.partial();

// Query params schema
export const {feature}QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  type: z.enum(['type1', 'type2', 'type3']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Types
export type Create{Feature}Input = z.infer<typeof create{Feature}Schema>;
export type Update{Feature}Input = z.infer<typeof update{Feature}Schema>;
export type {Feature}Query = z.infer<typeof {feature}QuerySchema>;
```

### 3.4 Définir la gestion des erreurs

```typescript
// Error codes for {feature}
enum {Feature}ErrorCode {
  // 400 - Bad Request
  {FEATURE}_VALIDATION_ERROR = '{FEATURE}_VALIDATION_ERROR',
  {FEATURE}_INVALID_TYPE = '{FEATURE}_INVALID_TYPE',

  // 404 - Not Found
  {FEATURE}_NOT_FOUND = '{FEATURE}_NOT_FOUND',

  // 409 - Conflict
  {FEATURE}_DUPLICATE = '{FEATURE}_DUPLICATE',
  {FEATURE}_IN_USE = '{FEATURE}_IN_USE',

  // 403 - Forbidden
  {FEATURE}_ACCESS_DENIED = '{FEATURE}_ACCESS_DENIED',
}
```

| Code | HTTP | Message | When |
|------|------|---------|------|
| `{FEATURE}_VALIDATION_ERROR` | 400 | Validation failed | Invalid input |
| `{FEATURE}_NOT_FOUND` | 404 | {Feature} not found | ID doesn't exist |
| `{FEATURE}_DUPLICATE` | 409 | {Feature} already exists | Name conflict |
| `{FEATURE}_ACCESS_DENIED` | 403 | Access denied | Not owner |

### 3.5 Spécifier la sécurité

| Endpoint | Auth | Authorization |
|----------|------|---------------|
| POST /api/{feature} | Required | Any authenticated user |
| GET /api/{feature}/:id | Required | Owner only |
| PUT /api/{feature}/:id | Required | Owner only |
| DELETE /api/{feature}/:id | Required | Owner only |
| GET /api/{feature} | Required | Own resources only |

**Rate Limiting**:
| Endpoint | Limit |
|----------|-------|
| POST | 10 req/min |
| GET | 100 req/min |
| PUT | 20 req/min |
| DELETE | 10 req/min |

---

## Output de cette phase

```markdown
## Detailed Specification

### API Endpoints
[Full documentation for each endpoint]

### Data Models
```prisma
[Prisma schema]
```

### Validation Schemas
```typescript
[Zod schemas]
```

### Error Codes
| Code | HTTP | Message |
|------|------|---------|
| [...] | [...] | [...] |

### Security Matrix
| Endpoint | Auth | Authz | Rate Limit |
|----------|------|-------|------------|
| [...] | [...] | [...] | [...] |
```

---

→ **Next**: `step-04-finalize.md` - Create test plan and finalize
