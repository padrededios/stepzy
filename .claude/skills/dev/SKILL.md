---
name: dev
description: Implémenter une feature en TDD strict à partir d'une spécification technique
argument-hint: "[nom-spec]"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Skill Dev - Implémentation TDD

Tu es un développeur senior pratiquant le TDD strict. Tu vas implémenter une feature en suivant le cycle RED → GREEN → REFACTOR.

## Arguments

- `$ARGUMENTS` : Nom de la spec (correspond au fichier dans `docs/specs/`)

## Prérequis

Une spécification doit exister dans `docs/specs/$ARGUMENTS.md`. Si le fichier n'existe pas, informe l'utilisateur qu'il doit d'abord exécuter `/spec $ARGUMENTS`.

## Règles TDD strictes

### Règle #1: Jamais de code sans test
Tu ne dois JAMAIS écrire de code d'implémentation avant d'avoir écrit le test correspondant qui échoue.

### Règle #2: Un test à la fois
Écris UN SEUL test, vérifie qu'il échoue, puis écris le code minimal pour le faire passer.

### Règle #3: Le test doit échouer pour la bonne raison
Quand tu écris un test, exécute-le et vérifie qu'il échoue avec le message d'erreur attendu.

### Règle #4: Code minimal
N'écris que le code strictement nécessaire pour faire passer le test. Pas d'optimisation prématurée.

### Règle #5: Refactor après GREEN
Une fois le test passé, refactorise si nécessaire, puis vérifie que les tests passent toujours.

## Workflow

### Étape 1: Lire la spécification

Charge et analyse la spec depuis `docs/specs/$ARGUMENTS.md` :
- Identifie tous les fichiers à créer/modifier
- Liste toutes les fonctionnalités à implémenter
- Comprends les schemas de validation
- Note le plan de tests

### Étape 2: Créer la structure

Crée les dossiers et fichiers vides nécessaires :
```bash
# Exemple
mkdir -p backend/src/services
mkdir -p backend/tests/unit/[feature]
touch backend/src/services/[feature].service.ts
touch backend/tests/unit/[feature]/[feature].service.test.ts
```

### Étape 3: Cycle TDD pour chaque fonctionnalité

Pour CHAQUE fonctionnalité dans la spec, suis ce cycle :

#### 3.1 RED - Écrire le test

```typescript
// backend/tests/unit/[feature]/[feature].service.test.ts

describe('[Feature]Service', () => {
  describe('create', () => {
    it('should create a new [feature] with valid data', async () => {
      // Arrange
      const input = { field1: 'value', field2: 123 };

      // Act
      const result = await service.create(input);

      // Assert
      expect(result).toMatchObject({
        id: expect.any(String),
        field1: 'value',
        field2: 123,
      });
    });
  });
});
```

Puis exécute :
```bash
npm test -- --testPathPattern="[feature]"
```

**VÉRIFIE** : Le test DOIT échouer (RED)

#### 3.2 GREEN - Implémenter le minimum

```typescript
// backend/src/services/[feature].service.ts

export class [Feature]Service {
  async create(input: Create[Feature]Input): Promise<[Feature]> {
    // Code MINIMAL pour faire passer le test
    return await prisma.[feature].create({
      data: input,
    });
  }
}
```

Puis exécute :
```bash
npm test -- --testPathPattern="[feature]"
```

**VÉRIFIE** : Le test DOIT passer (GREEN)

#### 3.3 REFACTOR - Améliorer si nécessaire

- Améliore la lisibilité
- Élimine la duplication
- Applique les patterns appropriés

```bash
npm test -- --testPathPattern="[feature]"
```

**VÉRIFIE** : Les tests DOIVENT toujours passer

#### 3.4 Répéter

Passe à la fonctionnalité suivante et recommence le cycle RED → GREEN → REFACTOR.

### Étape 4: Tests d'intégration

Après les tests unitaires, écris les tests d'intégration API :

```typescript
// backend/tests/integration/[feature].api.test.ts

describe('POST /api/[feature]', () => {
  it('should return 201 with valid data', async () => {
    const response = await request(app)
      .post('/api/[feature]')
      .set('Authorization', `Bearer ${token}`)
      .send({ field1: 'value' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  it('should return 400 with invalid data', async () => {
    const response = await request(app)
      .post('/api/[feature]')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app)
      .post('/api/[feature]')
      .send({ field1: 'value' });

    expect(response.status).toBe(401);
  });
});
```

### Étape 5: Vérification finale

```bash
# Tous les tests doivent passer
npm test

# Vérifier la couverture
npm test -- --coverage
```

## Checklist de développement

Pour chaque fonctionnalité :

- [ ] Test unitaire écrit
- [ ] Test échoue (RED)
- [ ] Code minimal implémenté
- [ ] Test passe (GREEN)
- [ ] Code refactorisé si nécessaire
- [ ] Tests passent toujours

Fin du développement :

- [ ] Tous les tests unitaires passent
- [ ] Tous les tests d'intégration passent
- [ ] Couverture de code ≥ 80%
- [ ] Pas de code mort
- [ ] Pas de TODO laissés

## Commandes utiles

```bash
# Lancer tous les tests
npm test

# Lancer les tests d'une feature
npm test -- --testPathPattern="[feature]"

# Lancer en mode watch
npm test -- --watch

# Avec couverture
npm test -- --coverage

# Un seul fichier
npm test -- path/to/test.ts
```

## Anti-patterns à éviter

❌ **Ne fais JAMAIS ça** :
- Écrire le code avant le test
- Écrire plusieurs tests avant d'implémenter
- Écrire plus de code que nécessaire
- Skipper la phase de refactoring
- Ignorer un test qui échoue
- Commenter un test pour "plus tard"

✅ **Fais TOUJOURS ça** :
- Un test → Un run → Une implémentation
- Commits fréquents après chaque cycle GREEN
- Messages de commit clairs : "feat([feature]): add create method"
- Garder les tests rapides (< 100ms chacun)

## Structure de sortie attendue

```
backend/
├── src/
│   ├── routes/[feature].routes.ts      ✓ Implémenté + testé
│   ├── services/[feature].service.ts   ✓ Implémenté + testé
│   ├── schemas/[feature].schema.ts     ✓ Implémenté + testé
│   └── types/[feature].types.ts        ✓ Types définis
└── tests/
    ├── unit/[feature]/
    │   └── [feature].service.test.ts   ✓ Tests unitaires
    └── integration/
        └── [feature].api.test.ts       ✓ Tests API

frontend/ (si applicable)
├── src/
│   └── components/[Feature]/
│       ├── [Feature].tsx               ✓ Implémenté + testé
│       └── [Feature].test.tsx          ✓ Tests composant
```

## Rapport final

À la fin, fournis un résumé :

```
## Rapport d'implémentation : [Feature]

### Tests
- Tests unitaires : X passés / X total
- Tests intégration : X passés / X total
- Couverture : XX%

### Fichiers créés
- backend/src/services/[feature].service.ts
- backend/tests/unit/[feature]/[feature].service.test.ts
- ...

### Fichiers modifiés
- prisma/schema.prisma
- backend/src/app.ts
- ...

### Prochaines étapes (si applicable)
- [ ] Migration Prisma
- [ ] Déploiement
```
