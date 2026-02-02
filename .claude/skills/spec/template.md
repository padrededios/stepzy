# Spécification Technique: [Nom de la Feature]

**Date**: [DATE]
**PRD Source**: `docs/prd/[nom].md`
**Auteur**: Claude AI
**Version**: 1.0

---

## 1. Vue d'ensemble

### 1.1 Résumé

[Résumé technique de ce qui doit être implémenté]

### 1.2 Référence PRD

Les user stories et critères d'acceptation sont définis dans le PRD associé.

---

## 2. Architecture

### 2.1 Diagramme des composants

```
┌─────────────────────────────────────────────────────────┐
│                       Frontend                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Component  │  │   Hooks     │  │   Store     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/WebSocket
┌────────────────────────▼────────────────────────────────┐
│                       Backend                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Routes    │  │  Services   │  │   Utils     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                      Database                           │
│  ┌─────────────┐  ┌─────────────┐                      │
│  │   Tables    │  │   Index     │                      │
│  └─────────────┘  └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Composants impactés

| Composant | Type | Action |
|-----------|------|--------|
| [Composant 1] | Nouveau | Créer |
| [Composant 2] | Existant | Modifier |

### 2.3 Flux de données

[Description du flux de données principal]

---

## 3. API Endpoints

### 3.1 `POST /api/[resource]`

**Description**: [Description]

**Authentification**: Requise

**Request Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "field1": "string",
  "field2": 123,
  "field3": true
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "field1": "string",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response 400 Bad Request**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "field1", "message": "Required" }
    ]
  }
}
```

**Response 401 Unauthorized**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

### 3.2 `GET /api/[resource]/:id`

**Description**: [Description]

**Authentification**: Requise

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| id | string | ID de la ressource |

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| include | string | - | Relations à inclure |

**Response 200 OK**:
```json
{
  "success": true,
  "data": {}
}
```

---

## 4. Base de données

### 4.1 Nouveaux modèles Prisma

```prisma
// Nouveau modèle
model [NomModele] {
  id        String   @id @default(cuid())

  // Champs
  field1    String
  field2    Int      @default(0)
  field3    Boolean  @default(false)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Index
  @@index([userId])
  @@index([createdAt])
}
```

### 4.2 Modifications aux modèles existants

```prisma
// Dans le modèle User, ajouter:
model User {
  // ... champs existants

  // Nouvelle relation
  [nomRelation] [NomModele][]
}
```

### 4.3 Migration

```bash
npx prisma migrate dev --name add_[feature_name]
```

---

## 5. Validation (Zod Schemas)

```typescript
// schemas/[feature].schema.ts

import { z } from 'zod';

export const create[Feature]Schema = z.object({
  field1: z.string().min(1).max(255),
  field2: z.number().int().positive(),
  field3: z.boolean().optional().default(false),
});

export const update[Feature]Schema = create[Feature]Schema.partial();

export type Create[Feature]Input = z.infer<typeof create[Feature]Schema>;
export type Update[Feature]Input = z.infer<typeof update[Feature]Schema>;
```

---

## 6. Gestion des erreurs

### 6.1 Codes d'erreur

| Code | HTTP Status | Message | Cause |
|------|-------------|---------|-------|
| `[FEATURE]_NOT_FOUND` | 404 | [Feature] not found | ID invalide |
| `[FEATURE]_INVALID_INPUT` | 400 | Invalid input | Validation échouée |
| `[FEATURE]_UNAUTHORIZED` | 403 | Not authorized | Pas de permission |

### 6.2 Logging

```typescript
// Niveaux de log
- ERROR: Erreurs inattendues, exceptions
- WARN: Erreurs gérées, rate limiting
- INFO: Actions utilisateur importantes
- DEBUG: Détails pour debugging (dev only)
```

---

## 7. Sécurité

### 7.1 Authentification

- [ ] JWT token requis pour tous les endpoints
- [ ] Vérification de l'expiration du token
- [ ] Refresh token si nécessaire

### 7.2 Autorisation

| Action | Rôle requis | Condition supplémentaire |
|--------|-------------|-------------------------|
| Create | User | - |
| Read | User | Owner ou Admin |
| Update | User | Owner uniquement |
| Delete | User | Owner uniquement |

### 7.3 Validation des inputs

- [ ] Tous les inputs validés avec Zod
- [ ] Sanitization des strings (XSS)
- [ ] Validation des IDs (format CUID)

### 7.4 Rate Limiting

| Endpoint | Limite | Fenêtre |
|----------|--------|---------|
| POST /api/[resource] | 10 req | 1 min |
| GET /api/[resource] | 100 req | 1 min |

---

## 8. Plan de tests

### 8.1 Tests unitaires

```
tests/unit/[feature]/
├── [feature].service.test.ts
├── [feature].validation.test.ts
└── [feature].utils.test.ts
```

**Cas à tester**:
- [ ] Création avec données valides
- [ ] Création avec données invalides
- [ ] Lecture existant
- [ ] Lecture inexistant
- [ ] Mise à jour
- [ ] Suppression
- [ ] Permissions

### 8.2 Tests d'intégration

```
tests/integration/[feature]/
└── [feature].api.test.ts
```

**Scénarios**:
- [ ] CRUD complet
- [ ] Gestion des erreurs
- [ ] Authentification
- [ ] Autorisation

### 8.3 Couverture cible

| Type | Couverture minimale |
|------|---------------------|
| Lignes | 80% |
| Branches | 75% |
| Fonctions | 90% |

---

## 9. Fichiers à créer/modifier

### 9.1 Nouveaux fichiers

```
backend/
├── src/
│   ├── routes/[feature].routes.ts
│   ├── services/[feature].service.ts
│   ├── schemas/[feature].schema.ts
│   └── types/[feature].types.ts
└── tests/
    └── [feature]/
        ├── [feature].service.test.ts
        └── [feature].api.test.ts

frontend/
├── src/
│   ├── components/[Feature]/
│   │   ├── [Feature].tsx
│   │   └── [Feature].test.tsx
│   ├── hooks/use[Feature].ts
│   └── api/[feature].api.ts
```

### 9.2 Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `prisma/schema.prisma` | Ajouter modèle |
| `backend/src/app.ts` | Enregistrer routes |
| `frontend/src/types/index.ts` | Exporter types |

---

## 10. Dépendances

### 10.1 Packages existants utilisés

- `zod` - Validation
- `prisma` - ORM
- `express` - Routing

### 10.2 Nouveaux packages (si nécessaire)

| Package | Version | Raison |
|---------|---------|--------|
| - | - | - |

---

## 11. Checklist de revue

Avant de passer au développement :

- [ ] Architecture validée
- [ ] API endpoints définis
- [ ] Schéma DB complet
- [ ] Validation schemas définis
- [ ] Plan de tests clair
- [ ] Sécurité considérée
- [ ] Pas de sur-ingénierie
