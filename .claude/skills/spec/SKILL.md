---
name: spec
description: Créer une spécification technique détaillée à partir d'un PRD
argument-hint: "[nom-prd]"
---

# Skill Spec - Spécification Technique

Tu es un architecte logiciel senior. Tu vas créer une spécification technique complète à partir d'un PRD existant.

## Arguments

- `$ARGUMENTS` : Nom du PRD (correspond au fichier dans `docs/prd/`)

## Prérequis

Un PRD doit exister dans `docs/prd/$ARGUMENTS.md`. Si le fichier n'existe pas, informe l'utilisateur qu'il doit d'abord exécuter `/prd $ARGUMENTS`.

## Workflow

### Étape 1: Lire le PRD

Charge et analyse le PRD depuis `docs/prd/$ARGUMENTS.md` :
- Comprends les user stories et critères d'acceptation
- Identifie les contraintes techniques mentionnées
- Note les dépendances

### Étape 2: Architecture

Crée un diagramme ASCII des composants :
```
┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend   │
└─────────────┘     └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Database   │
                    └─────────────┘
```

Décris :
- Les nouveaux composants à créer
- Les modifications aux composants existants
- Les interactions entre composants

### Étape 3: API Endpoints

Pour chaque endpoint, documente :
```
### POST /api/[resource]

**Description**: [Ce que fait l'endpoint]

**Auth**: Required | Optional | None

**Request Body**:
```json
{
  "field": "type"
}
```

**Response 200**:
```json
{
  "data": {}
}
```

**Erreurs**:
- 400: [Validation error]
- 401: [Unauthorized]
- 404: [Not found]
```

### Étape 4: Schéma Base de Données

Définis les modèles Prisma :
```prisma
model NouveauModel {
  id        String   @id @default(cuid())
  field     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  relation  Relation @relation(fields: [relationId], references: [id])
}
```

Inclus :
- Nouveaux modèles
- Modifications aux modèles existants
- Index nécessaires
- Relations

### Étape 5: Gestion des erreurs

Définis les codes d'erreur custom :
```typescript
enum ErrorCode {
  FEATURE_ERROR_001 = 'Description claire',
  FEATURE_ERROR_002 = 'Description claire',
}
```

Spécifie :
- Format des messages d'erreur
- Stratégie de logging
- Retry policy si applicable

### Étape 6: Sécurité

Détaille :
- Authentification requise
- Autorisations (qui peut faire quoi)
- Validation des inputs (Zod schemas)
- Rate limiting si nécessaire
- Sanitization des données

### Étape 7: Plan de tests

Liste ce qui doit être testé :
```
## Tests unitaires
- [ ] [Fonction/Service 1]
- [ ] [Fonction/Service 2]

## Tests d'intégration
- [ ] [Endpoint 1]
- [ ] [Endpoint 2]

## Tests E2E (si applicable)
- [ ] [Scénario 1]
```

### Étape 8: Générer la spec

Utilise le template dans `template.md` et génère le document final dans :
```
docs/specs/$ARGUMENTS.md
```

## Output attendu

Un fichier Markdown complet dans `docs/specs/[nom].md`, prêt à être utilisé par `/dev`.
