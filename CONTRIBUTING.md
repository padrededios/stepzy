# 🤝 Guide de Contribution - Stepzy Plateforme Multisports

Merci de votre intérêt pour contribuer au projet Stepzy ! Ce guide vous aidera à comprendre comment participer au développement de la plateforme multisports.

## 📋 Table des matières

- [Code de conduite](#-code-de-conduite)
- [Types de contributions](#-types-de-contributions)
- [Avant de commencer](#-avant-de-commencer)
- [Processus de développement](#-processus-de-développement)
- [Standards de code](#-standards-de-code)
- [Tests](#-tests)
- [Process de review](#-process-de-review)
- [Documentation](#-documentation)
- [Ressources](#-ressources)

## 📜 Code de conduite

Ce projet adhère au code de conduite du Contributor Covenant. En participant, vous vous engagez à respecter ce code. Veuillez signaler tout comportement inacceptable à [support@futsal.app](mailto:support@futsal.app).

### Nos engagements

- Utiliser un langage inclusif et respectueux
- Respecter les différents points de vue et expériences
- Accepter les critiques constructives avec grâce
- Se concentrer sur ce qui est le mieux pour la communauté

## 🎯 Types de contributions

Nous accueillons différents types de contributions :

### 🐛 Corrections de bugs
- Signalement de bugs via les [Issues GitHub](https://github.com/username/futsal/issues)
- Corrections de bugs existants
- Améliorations de la gestion d'erreurs

### ✨ Nouvelles fonctionnalités
- Propositions de nouvelles fonctionnalités
- Implémentation de fonctionnalités approuvées
- Améliorations UX/UI

### 📚 Documentation
- Correction de fautes de frappe
- Amélioration de la clarté
- Ajout d'exemples
- Traductions

### 🧪 Tests
- Ajout de tests manquants
- Amélioration de la couverture
- Tests de régression
- Tests de performance

### 🛠️ Infrastructure
- Améliorations CI/CD
- Optimisations Docker
- Monitoring et métriques
- Sécurité

## 🚀 Avant de commencer

### Prérequis techniques

- **Node.js** 20+ 
- **npm** 10+
- **Docker** & **Docker Compose**
- **Git** (avec configuration SSH recommandée)
- Éditeur avec support TypeScript (VS Code recommandé)

### Configuration environnement

1. **Fork** le repository principal
2. **Clone** votre fork localement :
   ```bash
   git clone git@github.com:votre-username/futsal.git
   cd futsal
   ```

3. **Ajoutez** le repository principal comme remote :
   ```bash
   git remote add upstream git@github.com:username/futsal.git
   ```

4. **Installez** les dépendances :
   ```bash
   npm install
   ```

5. **Configurez** l'environnement :
   ```bash
   cp .env.example .env.local
   # Éditez .env.local avec vos paramètres
   ```

6. **Démarrez** les services :
   ```bash
   docker-compose up -d
   npx prisma migrate dev
   npm run dev
   ```

### Extensions VS Code recommandées

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-playwright.playwright",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

## 🔄 Processus de développement

### Méthodologie TDD

Ce projet suit une approche **Test-Driven Development** stricte :

1. **Red** : Écrire un test qui échoue
2. **Green** : Écrire le code minimal pour faire passer le test
3. **Refactor** : Améliorer le code sans casser les tests

```bash
# Toujours commencer par les tests
npm test -- --watch

# Écrire les tests d'abord
# Puis implémenter la fonctionnalité
# Enfin refactoriser
```

### Workflow Git

#### 1. Créer une branche

```bash
# Synchroniser avec upstream
git fetch upstream
git checkout main
git merge upstream/main

# Créer une branche feature
git checkout -b feature/nom-fonctionnalite
```

#### 2. Développer

```bash
# Faire des commits atomiques et fréquents
git add .
git commit -m "feat: ajouter validation email"

# Pousser régulièrement
git push origin feature/nom-fonctionnalite
```

#### 3. Pull Request

- Créer une PR depuis votre fork vers main
- Remplir le template de PR
- Lier les issues concernées
- Demander une review

### Conventions de nommage

#### Branches
- `feature/description-courte` - Nouvelles fonctionnalités
- `fix/description-bug` - Corrections de bugs
- `docs/what-is-updated` - Documentation
- `refactor/what-is-refactored` - Refactoring
- `test/what-is-tested` - Tests

#### Commits

Suivre [Conventional Commits](https://www.conventionalcommits.org/) :

```bash
type(scope): description

feat(auth): ajouter validation email
fix(matches): corriger bug inscription double
docs(api): mettre à jour documentation endpoints
test(auth): ajouter tests validation mot de passe
refactor(cache): simplifier logique Redis
perf(db): optimiser requêtes matches
style(ui): corriger espacement header
chore(deps): mettre à jour dépendances
```

**Types disponibles :**
- `feat` - Nouvelle fonctionnalité
- `fix` - Correction de bug  
- `docs` - Documentation
- `test` - Tests
- `refactor` - Refactoring
- `perf` - Performance
- `style` - Style/formatage
- `chore` - Maintenance

## 📏 Standards de code

### TypeScript

```typescript
// ✅ Bon
interface User {
  id: string
  email: string
  pseudo: string
}

const createUser = async (data: CreateUserData): Promise<User> => {
  // Implementation
}

// ❌ Mauvais
const createUser = async (data: any) => {
  // any est interdit
}
```

### Composants React

```tsx
// ✅ Structure recommandée
interface Props {
  user: User
  onUpdate: (user: User) => void
}

export default function UserCard({ user, onUpdate }: Props) {
  const [loading, setLoading] = useState(false)
  
  const handleUpdate = useCallback(async () => {
    setLoading(true)
    try {
      await onUpdate(user)
    } finally {
      setLoading(false)
    }
  }, [user, onUpdate])

  return (
    <div className="p-4 border rounded">
      {/* Contenu */}
    </div>
  )
}
```

### API Routes

```typescript
// ✅ Structure recommandée
export async function GET(request: NextRequest) {
  return requireAuth(request, async (req, context) => {
    try {
      const data = await getMatches()
      
      return NextResponse.json({
        success: true,
        data
      })
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Erreur serveur'
      }, { status: 500 })
    }
  })
}
```

### Styles Tailwind

```tsx
// ✅ Classes organisées
<div className="
  flex items-center justify-between
  p-4 m-2
  bg-white border border-gray-200 rounded-lg
  hover:shadow-md
  transition-shadow duration-200
">

// ❌ Classes mélangées
<div className="flex bg-white p-4 hover:shadow-md items-center border-gray-200 rounded-lg">
```

### Configuration ESLint

Le projet utilise des règles strictes :

```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "prefer-const": "error"
  }
}
```

## 🧪 Tests

### Hiérarchie de tests

1. **Tests unitaires** (priorité haute)
2. **Tests d'intégration** (priorité moyenne)
3. **Tests E2E** (priorité normale)

### Tests unitaires

```typescript
// ✅ Test bien structuré
describe('User Service', () => {
  describe('createUser', () => {
    test('should create user with valid data', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        pseudo: 'testuser',
        password: 'Password123!'
      }

      // Act
      const user = await createUser(userData)

      // Assert
      expect(user).toHaveProperty('id')
      expect(user.email).toBe(userData.email)
      expect(user).not.toHaveProperty('password')
    })

    test('should throw error with invalid email', async () => {
      const userData = { email: 'invalid', pseudo: 'test', password: 'Pass123!' }
      
      await expect(createUser(userData)).rejects.toThrow('Invalid email')
    })
  })
})
```

### Tests composants

```typescript
// ✅ Test composant
describe('MatchCard', () => {
  const mockMatch = {
    id: '1',
    date: new Date('2024-02-15T12:00:00Z'),
    maxPlayers: 12,
    status: 'open' as const,
    players: []
  }

  test('should display match information', () => {
    render(
      <MatchCard 
        match={mockMatch} 
        onJoin={jest.fn()} 
        onLeave={jest.fn()} 
        currentUserId="user1" 
      />
    )

    expect(screen.getByText('15/02/2024')).toBeInTheDocument()
    expect(screen.getByText('12:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /s'inscrire/i })).toBeInTheDocument()
  })
})
```

### Commandes de test

```bash
# Tests en mode watch
npm test -- --watch

# Tests avec couverture
npm run test:coverage

# Tests E2E
npm run test:e2e

# Tests de performance
npm run test:performance

# Tous les tests
npm run test:all
```

### Couverture requise

- **Minimum** : 80%
- **Objectif** : 95%
- **Branches critiques** : 100% (auth, paiements, sécurité)

## 👀 Process de review

### Checklist PR

Avant de soumettre votre PR :

- [ ] ✅ Tests passent (`npm run test:all`)
- [ ] ✅ Lint propre (`npm run lint`)
- [ ] ✅ Types valides (`npm run type-check`)
- [ ] ✅ Build réussie (`npm run build`)
- [ ] ✅ Tests ajoutés pour nouveau code
- [ ] ✅ Documentation mise à jour si nécessaire
- [ ] ✅ Changements testés localement
- [ ] ✅ Commit messages suivent la convention
- [ ] ✅ Pas de console.log ou debugger
- [ ] ✅ Pas de TODO ou FIXME

### Template PR

```markdown
## 📝 Description
Brève description des changements

## 🔗 Issues liées
- Fixes #123
- Related to #456

## 🧪 Tests
- [ ] Tests unitaires ajoutés
- [ ] Tests d'intégration ajoutés
- [ ] Tests E2E mis à jour
- [ ] Tests manuels effectués

## 📷 Screenshots (si applicable)
<!-- Ajouter des captures d'écran pour les changements UI -->

## ✅ Checklist
- [ ] Code review auto-effectuée
- [ ] Tests passent
- [ ] Documentation mise à jour
- [ ] Pas de breaking changes (ou documentés)
```

### Processus review

1. **Auto-review** : Relire son propre code
2. **Tests automatiques** : CI doit être vert
3. **Review par les pairs** : Au moins 1 approbation
4. **Tests manuels** : Si changements UI/UX
5. **Merge** : Squash et merge par mainteneur

### Critères d'approbation

- ✅ Code lisible et maintenable
- ✅ Tests appropriés et passants
- ✅ Respect des standards projet
- ✅ Performance acceptable
- ✅ Sécurité vérifiée
- ✅ Accessibilité respectée

## 📚 Documentation

### Code

```typescript
/**
 * Creates a new match with validation and constraints
 * 
 * @param data - Match creation data
 * @param data.date - Match date (must be weekday 12h-14h)
 * @param data.maxPlayers - Maximum players (2-24)
 * @returns Promise resolving to created match
 * @throws {ValidationError} When data is invalid
 * @throws {BusinessError} When business rules violated
 * 
 * @example
 * ```typescript
 * const match = await createMatch({
 *   date: new Date('2024-02-15T12:00:00Z'),
 *   maxPlayers: 12
 * })
 * ```
 */
export async function createMatch(data: CreateMatchData): Promise<Match> {
  // Implementation
}
```

### Composants

```tsx
/**
 * Match card component displaying match information and actions
 * 
 * Features:
 * - Shows match date, time, and player count
 * - Join/leave functionality for authenticated users
 * - Responsive design for mobile/desktop
 * - Accessibility compliant (WCAG 2.1 AA)
 * 
 * @example
 * ```tsx
 * <MatchCard
 *   match={match}
 *   onJoin={handleJoin}
 *   onLeave={handleLeave}
 *   currentUserId="user123"
 * />
 * ```
 */
export default function MatchCard({ match, onJoin, onLeave, currentUserId }: Props) {
  // Implementation
}
```

## 🎯 Types de contributions spécifiques

### 🐛 Signaler un bug

1. Vérifier qu'il n'existe pas déjà
2. Utiliser le template d'issue bug
3. Fournir steps de reproduction
4. Inclure environnement (OS, navigateur, version)
5. Ajouter captures d'écran si pertinent

### ✨ Proposer une fonctionnalité

1. Vérifier qu'elle n'est pas déjà demandée
2. Utiliser le template d'issue feature
3. Expliquer le problème résolu
4. Proposer une solution
5. Discuter avec l'équipe avant implémentation

### 🔧 Amélioration performance

1. Profiler et mesurer avant
2. Implémenter l'amélioration
3. Mesurer après avec benchmarks
4. Documenter les gains
5. Ajouter tests performance

### 🛡️ Sécurité

1. **NE PAS** ouvrir d'issue publique
2. Envoyer email à [security@futsal.app](mailto:security@futsal.app)
3. Fournir détails et reproduction
4. Attendre validation avant disclosure

## 🔧 Ressources développeur

### Extensions utiles

- **Prettier** - Formatage automatique
- **ESLint** - Détection erreurs
- **Tailwind IntelliSense** - Autocomplétion CSS
- **Prisma** - Support ORM
- **Thunder Client** - Tests API
- **GitLens** - Historique Git avancé

### Scripts npm

```bash
npm run dev          # Démarrage développement
npm run build        # Build production
npm run start        # Démarrage production
npm run lint         # Vérification code
npm run lint:fix     # Correction automatique
npm run type-check   # Vérification types
npm test             # Tests unitaires
npm run test:e2e     # Tests E2E
npm run db:migrate   # Migration base
npm run db:seed      # Seed données test
```

### Debugging

```typescript
// ✅ Logging structuré
import { logger } from '@/lib/logging'

logger.info('User action', { 
  userId: user.id, 
  action: 'match_join',
  matchId: match.id 
})

// ❌ Console.log (à éviter en prod)
console.log('Debug info') // Ne pas commit
```

### Performance

```typescript
// ✅ Mesure performance
import { performance } from 'perf_hooks'

const start = performance.now()
await heavyOperation()
const duration = performance.now() - start

logger.info('Operation performance', { duration, operation: 'heavy' })
```

## 📞 Support développeur

### Canaux communication

- **Issues GitHub** : Bugs et features
- **Discussions GitHub** : Questions générales
- **Email** : [dev@futsal.app](mailto:dev@futsal.app)
- **Discord** : [Invitation communauté](https://discord.gg/futsal-dev)

### Documentation technique

- **API Docs** : [docs/api-specification.yaml](docs/api-specification.yaml)
- **Architecture** : [docs/architecture.md](docs/architecture.md)
- **Deployment** : [docs/deployment.md](docs/deployment.md)
- **Troubleshooting** : [docs/troubleshooting.md](docs/troubleshooting.md)

## 🏆 Reconnaissance

Les contributeurs sont reconnus dans :

- **README.md** - Liste des contributeurs
- **CHANGELOG.md** - Crédits par version
- **GitHub Contributors** - Graphique contributions
- **Release notes** - Remerciements spéciaux

### Hall of Fame

- **Top contributors** : Badge spécial
- **First-time contributors** : Mention welcome
- **Long-term maintainers** : Accès étendu

---

## 🚀 Prêt à contribuer ?

1. **Fork** le projet
2. **Clone** localement
3. **Create branch** pour votre contribution
4. **Write tests** d'abord (TDD)
5. **Implement** la fonctionnalité
6. **Submit PR** avec description claire

**Merci de faire partie de la communauté Futsal !** ⚽❤️

Pour toute question : [CONTRIBUTING-FAQ.md](docs/CONTRIBUTING-FAQ.md)