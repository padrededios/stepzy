# 📋 Cahier des Charges - Stepzy Plateforme Multisports

## 🎯 Vision du Projet

Plateforme Next.js (App Router) avec Better-auth et PostgreSQL pour la réservation d'activités sportives multiples (Football, Badminton, Volleyball, Ping-Pong, Rugby), développée en méthodologie TDD (Test-Driven Development).

## 🏗️ Architecture Technique

### Stack Technologique
- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **Authentication**: Better-auth avec email/password
- **Database**: PostgreSQL + Prisma ORM
- **Testing**: Jest + Testing Library + Playwright (E2E)
- **Containerization**: Docker pour PostgreSQL + Redis
- **Deployment**: Docker + Vercel/Railway
- **Monitoring**: Sentry + Analytics

### Méthodologie
- **TDD Strict**: Chaque fonctionnalité commence par l'écriture des tests, puis l'implémentation, puis la validation
- **Couverture de code**: Objectif > 90%
- **Tests**: Unitaires, intégration, E2E complets

## 🔄 Plan de Séparation Backend / Frontend

### Architecture Cible (Monorepo Multi-Frontend)

**Objectif**: Séparer le backend du frontend pour permettre plusieurs frontends (web-app utilisateur + admin-app) accédant à la même API.

#### Structure du Monorepo
```
stepzy/
├── packages/
│   ├── backend/                  # API REST standalone
│   │   ├── src/
│   │   │   ├── routes/          # Routes API organisées par ressource
│   │   │   ├── services/        # Logique métier
│   │   │   ├── middleware/      # Auth, validation, CORS
│   │   │   ├── database/        # Prisma client singleton
│   │   │   └── types/           # Types backend
│   │   ├── prisma/              # Schema et migrations
│   │   └── package.json
│   │
│   ├── shared/                   # Code partagé entre packages
│   │   ├── types/               # Types TypeScript communs
│   │   ├── constants/           # SPORTS_CONFIG, routes API
│   │   ├── utils/               # Fonctions utilitaires
│   │   └── package.json
│   │
│   ├── web-app/                  # Frontend utilisateur (actuel)
│   │   ├── src/
│   │   │   ├── app/             # Pages Next.js
│   │   │   ├── components/      # Composants UI
│   │   │   ├── hooks/           # React hooks
│   │   │   └── lib/api/         # Client API HTTP
│   │   └── package.json
│   │
│   └── admin-app/                # Dashboard admin (futur)
│       ├── src/
│       │   ├── app/             # Pages admin
│       │   ├── components/      # Composants admin
│       │   └── lib/api/         # Client API (réutilisé)
│       └── package.json
│
├── package.json                  # Root package (workspaces)
└── turbo.json                    # Configuration Turborepo
```

### Backend (API REST Standalone)

#### Technologies
- **Framework**: Fastify (plus performant qu'Express)
- **ORM**: Prisma (conservé)
- **Auth**: Better-auth (conservé, compatible multi-frontend)
- **Validation**: Zod (conservé)
- **Cache**: Redis (conservé)

#### Structure Backend
```typescript
backend/
├── src/
│   ├── index.ts                 # Point d'entrée serveur
│   ├── routes/
│   │   ├── auth.routes.ts       # POST /api/auth/login, /register, /me
│   │   ├── activities.routes.ts # CRUD /api/activities/*
│   │   ├── sessions.routes.ts   # CRUD /api/activities/sessions/*
│   │   ├── users.routes.ts      # CRUD /api/users/*
│   │   └── admin.routes.ts      # Routes admin /api/admin/*
│   │
│   ├── services/
│   │   ├── auth.service.ts      # Logique authentification
│   │   ├── activity.service.ts  # Logique activités
│   │   ├── session.service.ts   # Logique sessions
│   │   └── user.service.ts      # Logique utilisateurs
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts   # Vérification Better-auth session
│   │   ├── admin.middleware.ts  # Vérification role admin
│   │   ├── validation.middleware.ts # Validation Zod
│   │   └── cors.middleware.ts   # CORS multi-origine
│   │
│   └── database/
│       ├── prisma.ts            # Client Prisma singleton
│       └── repositories/        # Data access layer
```

#### Format API Standardisé
```typescript
// Toutes les réponses suivent ce format
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}

// Authentification via Better-auth
// Session cookies gérés automatiquement

// Routes RESTful
GET    /api/activities          # Liste activités
POST   /api/activities          # Créer activité
GET    /api/activities/:id      # Détail activité
PUT    /api/activities/:id      # Modifier activité
DELETE /api/activities/:id      # Supprimer activité
```

### Package Shared (@stepzy/shared)

#### Contenu
```typescript
shared/
├── types/
│   ├── user.types.ts           # User, UserStats, etc.
│   ├── activity.types.ts       # Activity, Session, etc.
│   ├── api.types.ts            # ApiResponse, ApiError
│   └── index.ts                # Exports centralisés
│
├── constants/
│   ├── sports.config.ts        # SPORTS_CONFIG
│   ├── routes.ts               # Routes API
│   └── index.ts
│
└── utils/
    ├── date.utils.ts           # formatDate, formatTime
    ├── validation.utils.ts     # Validateurs communs
    └── index.ts
```

**Avantages**:
- Types partagés entre backend et tous les frontends
- Évite duplication de code (SPORTS_CONFIG, utilitaires)
- Single source of truth pour les constantes
- Import facile: `import { User } from '@stepzy/shared'`

### Web App (Frontend Utilisateur)

#### Structure
```typescript
web-app/
├── src/
│   ├── app/                     # Next.js App Router (inchangé)
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   └── page.tsx
│   │
│   ├── components/              # Composants (inchangés)
│   │
│   ├── lib/
│   │   └── api/                 # Client API HTTP
│   │       ├── client.ts        # Wrapper Fetch avec JWT
│   │       ├── activities.api.ts
│   │       ├── auth.api.ts
│   │       └── users.api.ts
│   │
│   └── hooks/                   # React hooks (inchangés)
│
└── .env.local
    NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Client API
```typescript
// lib/api/client.ts
class ApiClient {
  private baseURL = process.env.NEXT_PUBLIC_API_URL

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    return response.json()
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    // ...
  }
}

export const apiClient = new ApiClient()
```

### Admin App (Dashboard Futur)

#### Structure
```typescript
admin-app/
├── src/
│   ├── app/
│   │   ├── dashboard/          # Vue d'ensemble admin
│   │   ├── users/              # Gestion utilisateurs
│   │   ├── activities/         # Gestion activités
│   │   └── statistics/         # Statistiques
│   │
│   ├── components/
│   │   ├── admin/              # Composants admin spécifiques
│   │   └── shared/             # Composants réutilisés
│   │
│   └── lib/
│       └── api/
│           └── admin.api.ts    # Routes admin
│
└── .env.local
    NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Authentification Multi-Frontend

#### Stratégie Better-auth
```typescript
// 1. Login - Backend via Better-auth
POST /api/auth/sign-in/email
Request: { email, password }
Response: {
  user: { id, email, name, role, image },
  session: { ... }
}
// Cookie de session automatiquement défini

// 2. Frontend utilise les cookies
// Pas besoin de localStorage - Better-auth gère les cookies

// 3. Toutes les requêtes incluent le cookie
// Cookie: better-auth.session_token=...

// 4. Backend vérifie via Better-auth
requireAuth → vérifie session → req.user = sessionUser
```

#### Middleware Auth
```typescript
// middleware/auth.middleware.ts
import { auth } from '../lib/auth'

export const requireAuth = async (req, res, next) => {
  const session = await auth.api.getSession({
    headers: req.headers
  })

  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Non authentifié'
    })
  }

  req.user = session.user
  req.session = session.session
  next()
}

// middleware/admin.middleware.ts
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'root') {
    return res.status(403).json({
      success: false,
      error: 'Accès administrateur requis'
    })
  }
  next()
}

// Utilisation
router.get('/api/admin/users', requireAuth, requireAdmin, getUsers)
```

### Configuration CORS

```typescript
// middleware/cors.middleware.ts
const allowedOrigins = [
  'http://localhost:3000',      // web-app dev
  'http://localhost:3002',      // admin-app dev
  'https://stepzy.com',         // web-app prod
  'https://admin.stepzy.com'    // admin-app prod
]

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Non autorisé par CORS'))
    }
  },
  credentials: true
})
```

### Plan de Migration (6-8 semaines)

#### Phase 1: Préparation (1-2 semaines)
- ✓ Créer structure monorepo avec Turborepo
- ✓ Créer package @stepzy/shared
- ✓ Migrer types communs vers shared
- ✓ Migrer constantes (SPORTS_CONFIG, etc.)
- ✓ Configurer npm workspaces

#### Phase 2: Backend Standalone (2-3 semaines)
- ✓ Créer projet backend avec Fastify
- ✓ Migrer Prisma vers backend
- ✓ Configurer Better-auth avec Fastify
- ✓ Migrer routes API (auth, activities, users, admin)
- ✓ Implémenter middlewares (auth, admin, CORS, validation)
- ✓ Tester toutes les routes avec Postman/Thunder Client

#### Phase 3: Adaptation Web App (1-2 semaines)
- ✓ Créer package web-app
- ✓ Migrer pages Next.js actuelles
- ✓ Créer client API HTTP
- ✓ Remplacer `fetch('/api/...')` par `apiClient.get(...)`
- ✓ Configurer variables d'environnement
- ✓ Tester intégration frontend-backend

#### Phase 4: Admin App (2-3 semaines)
- ✓ Créer package admin-app
- ✓ Implémenter pages admin (users, activities, statistics)
- ✓ Réutiliser client API
- ✓ Développer composants admin
- ✓ Tests E2E admin

#### Phase 5: Déploiement (1 semaine)
- ✓ Déployer backend (Railway, Render, Fly.io)
- ✓ Déployer web-app (Vercel)
- ✓ Déployer admin-app (Vercel)
- ✓ Configurer DNS et SSL
- ✓ Tests production

### Avantages Architecture

| Aspect | Avant (Monolithe) | Après (Séparé) |
|--------|-------------------|----------------|
| **Scalabilité** | Couplé frontend/backend | Scalabilité indépendante |
| **Déploiement** | Monolithique | Indépendant par service |
| **Développement** | Équipe unique | Équipes spécialisées possibles |
| **Réutilisation** | Code dupliqué | Code partagé via @stepzy/shared |
| **Multi-frontend** | Impossible | Natif (web + admin + mobile future) |
| **Tests** | Couplés | Isolés par service |
| **Performance** | Tout ou rien | Cache/CDN par frontend |
| **Maintenance** | Modifications risquées | Modifications isolées |

### Stack Technique Recommandée

#### Backend
- **Runtime**: Node.js 20+
- **Framework**: Fastify (plus rapide qu'Express)
- **ORM**: Prisma (conservé)
- **Auth**: JWT + bcrypt
- **Validation**: Zod (conservé)
- **Cache**: Redis (conservé)
- **Tests**: Jest + Supertest

#### Shared
- **Language**: TypeScript strict
- **Exports**: Types + Constants + Utils
- **Build**: tsup (fast bundler)

#### Frontends
- **Framework**: Next.js 15 App Router (conservé)
- **State**: React hooks + Context API
- **Styling**: Tailwind CSS v4 (conservé)
- **API Client**: Fetch wrapper custom + types
- **Tests**: Jest + Testing Library + Playwright

#### Monorepo
- **Tool**: Turborepo (parallel builds)
- **Package Manager**: npm workspaces
- **CI/CD**: GitHub Actions

### Variables d'Environnement

#### Backend (.env)
```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
REDIS_URL="redis://..."
NODE_ENV="development"
PORT="3001"
CORS_ORIGINS="http://localhost:3000,http://localhost:3002"
```

#### Web App (.env.local)
```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### Admin App (.env.local)
```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3002"
```

### Scripts de Développement

```json
// package.json (root)
{
  "scripts": {
    "dev": "turbo run dev",
    "dev:backend": "turbo run dev --filter=backend",
    "dev:web": "turbo run dev --filter=web-app",
    "dev:admin": "turbo run dev --filter=admin-app",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "workspaces": ["packages/*"]
}
```

**Développement local**:
```bash
# Terminal 1 - Backend
npm run dev:backend  # → http://localhost:3001

# Terminal 2 - Web App
npm run dev:web      # → http://localhost:3000

# Terminal 3 - Admin App
npm run dev:admin    # → http://localhost:3002
```

### Points d'Attention

#### Sécurité
- ✓ Valider toutes les entrées côté backend (Zod)
- ✓ Utiliser HTTPS en production uniquement
- ✓ Implémenter rate limiting (5 req/min login)
- ✓ Sanitizer les erreurs (pas de stack traces)
- ✓ Hash passwords avec bcrypt (12 rounds)
- ✓ JWT avec expiration courte (7j) + refresh token

#### Performance
- ✓ Cache Redis pour requêtes fréquentes
- ✓ Pagination obligatoire (limit 50 par défaut)
- ✓ Optimiser requêtes Prisma (select, include)
- ✓ Compression gzip/brotli
- ✓ CDN pour assets statiques

#### Monitoring
- ✓ Logger toutes erreurs (Winston/Pino)
- ✓ Health check: GET /api/health
- ✓ Métriques (CPU, RAM, latence)
- ✓ Sentry pour tracking erreurs
- ✓ Analytics utilisateurs

## 📊 Modèle de Données

### Entités Principales

#### User
- `id` (string, PK)
- `email` (string, unique)
- `password` (string, hashed)
- `pseudo` (string, 3-30 chars)
- `avatar` (string, URL optionnel)
- `role` (enum: 'user' | 'root')
- `createdAt`, `updatedAt`

#### Match
- `id` (string, PK)
- `date` (DateTime, horaires flexibles)
- `sport` (enum: 'football' | 'badminton' | 'volley' | 'pingpong' | 'rugby')
- `maxPlayers` (int, dépend du sport)
- `status` (enum: 'open' | 'full' | 'cancelled' | 'completed')
- `createdAt`, `updatedAt`

#### MatchPlayer
- `id` (string, PK)
- `userId` (string, FK)
- `matchId` (string, FK)
- `status` (enum: 'confirmed' | 'waiting')
- `joinedAt` (DateTime)

#### Activity (Activités Récurrentes)
- `id` (string, PK)
- `name` (string, nom de l'activité)
- `description` (string, optionnel)
- `sport` (enum: SportType)
- `maxPlayers` (int, nombre max de joueurs par session)
- `createdBy` (string, FK User)
- `isPublic` (boolean, visibilité)
- `recurringDays` (string[], jours de récurrence)
- `recurringType` (enum: 'weekly' | 'monthly')
- `createdAt`, `updatedAt`

#### ActivitySession
- `id` (string, PK)
- `activityId` (string, FK Activity)
- `date` (DateTime, date/heure de la session)
- `maxPlayers` (int, nombre max de joueurs)
- `status` (enum: 'active' | 'cancelled' | 'completed')
- `isCancelled` (boolean)
- `createdAt`, `updatedAt`

#### ActivityParticipant
- `id` (string, PK)
- `sessionId` (string, FK ActivitySession)
- `userId` (string, FK User)
- `status` (enum: 'interested' | 'confirmed' | 'waiting')
- `joinedAt` (DateTime)

#### ActivitySubscription
- `id` (string, PK)
- `activityId` (string, FK Activity)
- `userId` (string, FK User)
- `subscribedAt` (DateTime)
- Contrainte unique: (activityId, userId)

#### Session (Better-auth)
- `id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent`, etc.

## 🎮 Fonctionnalités Métier

### Système d'Authentification
- **Inscription**: Email + pseudo + mot de passe (validation force) + avatar optionnel
- **Connexion**: Email/password avec sessions sécurisées
- **Gestion des rôles**: user (standard) / root (admin)
- **Avatars**: Auto-génération via DiceBear si non fourni
- **Rate limiting**: Protection contre les attaques par force brute

### Gestion des Activités Multisports

#### Pour les Utilisateurs
- **Visualisation**: Semaine courante + semaine suivante
- **Inscription**: Automatique si places disponibles
- **Liste d'attente**: Auto-ajout si activité complète (max dépend du sport)
- **Promotion automatique**: Premier en attente → confirmé si désistement
- **Sélection de sport**: Interface visuelle avec icônes par sport
- **Actions**: Inscription/désinscription via clics sur avatars

#### Pour les Administrateurs
- **CRUD complet**: Création, modification, suppression d'activités multisports
- **Gestion forcée**: Inscrire/désinscrire n'importe qui
- **Remplacement**: Échanger des joueurs entre eux
- **Statistiques**: Vue globale des inscriptions

### Contraintes Métier
- **Horaires**: Créneaux flexibles selon disponibilités
- **Capacité**: Variable selon sport (6 pour badminton/ping-pong, 12 pour football, 16 pour volleyball/rugby)
- **Liste d'attente**: Illimitée, promotion FIFO automatique
- **Validation**: Un utilisateur = un slot par match maximum
- **Fermeture inscriptions**: 15 minutes avant début d'activité
- **Archivage**: Activités automatiquement masquées après leur fin

## 🖥️ Interface Utilisateur

### Layout & Navigation
- **Header**: Logo Stepzy, navigation sports, notifications, menu utilisateur avec avatar
- **Sidebar**: Navigation globale (Mes Activités, S'inscrire, Mes Statistiques, Mon Profil, Administration pour admin)
- **DashboardLayout**: Interface moderne "page-in-page" unifiée avec layout persistant
- **Layout persistant**: Utilisation de Next.js Layout Groups `(dashboard)` pour éviter les re-renders du header/footer
- **Context API**: Hook `useCurrentUser()` pour accès utilisateur sans props drilling
- **Menu utilisateur**: Dropdown correctement positionné sous l'avatar
- **Responsive**: Mobile-first, adaptable desktop avec breakpoints optimisés

### Pages Principales

#### Mes Activités (/mes-activites)
- **Onglets**: Mes participations, Sessions disponibles, Historique, Créer une activité
- **Système récurrent**: Affichage des activités récurrentes avec leurs sessions
- **Filtrage**: Par sport, statut, disponibilité
- **Actions rapides**: Inscription/désinscription aux sessions avec notifications toast
- **Gestion temporelle**: Masquage automatique activités expirées
- **Mise à jour optimiste**: Rafraîchissement instantané des boutons sans rechargement page
- **Formulaire intégré**: Création d'activité directement dans l'onglet, sans redirection
- **Interface épurée**: Pas de header redondant, navigation fluide entre onglets
- **États vides**: Messages d'aide contextuel quand aucune participation

#### S'inscrire (/s-inscrire)
- **Catalogue activités**: Toutes les activités récurrentes disponibles
- **Filtres**: Par sport et tri (nom, sport)
- **Cartes activités**: Design moderne avec icônes sport et informations récurrence
- **Actions**: Inscription/désinscription aux activités avec notifications toast
- **Gestion permissions**: Bouton "Gérer" pour les créateurs d'activités
- **Interface épurée**: Pas de header redondant, navigation directe vers les filtres

#### Vue Match Détaillée (/matches/[id])
- **Layout terrain**: Style MPG avec positions 6v6
- **Joueurs confirmés**: Avatars sur les positions
- **Banc d'attente**: Liste d'attente avec positions
- **Actions**: Clics avatars pour se désinscrire

#### Administration (/admin)
- **Gestion utilisateurs** (`/admin/users`): CRUD complet, réinitialisation mots de passe
- **Statistiques** (`/admin/statistics`): Tableaux de bord temps réel avec graphiques
- **Gestion activités** (`/admin/matches`): CRUD complet, inscriptions forcées
- **Création activités** (`/admin/matches/create`): Interface multisports avec récurrence
- **Annonces** (`/admin/announcements`): Système d'annonces avec notifications

#### Notifications (/notifications)
- **Centre notifications**: Page dédiée avec filtres (toutes/non lues)
- **Historique complet**: Toutes les notifications avec pagination
- **Actions**: Marquer comme lu individuellement ou globalement
- **Intégration**: Liens directs vers activités concernées

#### Profil Utilisateur (/profile)
- **Informations personnelles**: Pseudo, email, avatar, statistiques
- **Historique activités**: Matchs passés avec détails
- **Préférences**: Notifications email/push, paramètres

#### Mes Statistiques (/mes-statistiques)
- **Vue d'ensemble**: Cartes statistiques (activités totales, taux participation, heures jouées, série)
- **Répartition par sport**: Détails participations et performances par sport
- **Activité mensuelle**: Graphiques d'évolution dans le temps
- **Badges et réalisations**: Système de progression et accomplissements
- **Interface épurée**: Pas de header redondant, navigation directe vers les statistiques

### Composants Réutilisables
- **MatchCard**: Affichage compact activité avec actions multisports
- **Avatar**: Fallback automatique DiceBear avec génération déterministe
- **NotificationCenter**: Dropdown notifications dans header avec badge
- **Toast**: Système de notifications modernes (success/error/info) avec design élégant
- **DashboardLayout**: Layout unifié avec sidebar et header, fourni via Context API
- **ProtectedRoute**: HOC protection routes avec gestion rôles et pattern render prop
- **LoadingStates**: Feedback visuel pour toutes actions async
- **ErrorHandling**: Messages d'erreur contextuels et user-friendly

### Système de Notifications
- **Toast modernes**: Notifications en haut à droite avec dégradés de couleurs
- **Types**: Success (vert/teal), Error (rouge/rose), Info (bleu)
- **Design**: Icônes circulaires, animations slide-in, auto-fermeture 3s
- **Usage**: Retours visuels pour inscriptions, désinscriptions, erreurs

## 🔐 Sécurité & Authentification

### Better-auth Configuration
- **Provider**: Email/password uniquement
- **Sessions**: Cookies sécurisés, expiration 7 jours
- **Rate limiting**: 5 tentatives/minute connexion, 3/minute inscription
- **Validation**: Email format, pseudo 3-30 chars, mot de passe fort

### Middleware de Protection
- `requireAuth`: Routes authentifiées uniquement
- `requireAdmin`: Routes admin (role=root) uniquement
- `withOptionalAuth`: Contexte utilisateur optionnel
- Rate limiting par utilisateur

### Permissions
- **Utilisateurs**: Inscription/désinscription propres matchs
- **Administrateurs**: CRUD complet + gestion utilisateurs
- **Protection**: Impossible supprimer dernier admin
- **Isolation**: Chaque utilisateur voit ses propres données

## 🧪 Stratégie de Tests

### Coverage Objectifs
- **Tests unitaires**: > 90% coverage
- **Tests intégration**: API endpoints complets
- **Tests E2E**: Parcours utilisateur critiques
- **Tests composants**: Interactions UI complètes

### Types de Tests
- **Auth**: Inscription, connexion, permissions, middleware
- **API**: CRUD matchs, inscriptions, gestion erreurs
- **UI**: Composants, formulaires, navigation
- **E2E**: Parcours complets utilisateur/admin

## 🚀 Critères de Succès

### Performance
- **API**: Temps réponse < 200ms
- **UI**: Interface responsive tous devices
- **Database**: Requêtes optimisées avec Prisma

### Qualité
- **Tests**: > 90% couverture, tous types
- **Sécurité**: Zero faille critique
- **Accessibilité**: WCAG 2.1 AA
- **Code**: ESLint + Prettier, TypeScript strict

### Fonctionnel
- **Inscription**: Processus fluide < 2 minutes
- **Matchs**: Réservation en 3 clics maximum
- **Admin**: Gestion complète utilisateurs/matchs
- **Mobile**: Expérience native-like

## 🎮 Système de Gestion Avancé

### Gestion Temporelle Intelligente
- **Fermeture inscriptions**: Automatique 15 minutes avant début activité
- **Masquage activités**: Automatique après leur fin pour éviter inscriptions tardives
- **Nettoyage automatique**: API `/api/cleanup` pour marquer activités terminées
- **Archivage**: Suppression activités anciennes (30+ jours) pour performance

### API de Maintenance
- **Nettoyage manuel**: `/api/cleanup?secret=cleanup-secret` (GET)
- **Nettoyage automatique**: `/api/cleanup` (POST) avec authentification
- **Marquage terminé**: Activités passées automatiquement marquées 'completed'
- **Suppression ancienne**: Nettoyage base données activités + inscriptions anciennes

## 🏗️ Code Quality & Architecture

### Structure TypeScript Optimisée
- **Types centralisés**: `/src/types/` avec modules `user.ts`, `match.ts`, `index.ts`
- **Utilitaires consolidés**: `/src/lib/utils/` avec fonctions réutilisables
- **API client unifié**: `/src/lib/api/client.ts` pour requests HTTP consistantes
- **Imports absolus**: Utilisation systématique `@/` pour meilleure maintenabilité

### Qualité Code
- **Zero code mort**: Suppression console.log et imports inutilisés
- **Interfaces unifiées**: Elimination doublons (25+ interfaces User supprimées)
- **Standards TypeScript**: Configuration strict, pas de `any`, types explicites
- **Architecture modulaire**: Séparation claire responsabilités

### Sessions Utilisateur
- **Durée**: 7 jours par défaut avec renouvellement automatique
- **Sécurité**: Cookies httpOnly, protection CSRF, validation tokens
- **Surveillance**: Détection activité suspecte, invalidation préventive

## 🔧 Configuration & Déploiement

### Environnements
- **Development**: Docker local + Next.js dev
- **Testing**: Base données test isolée
- **Production**: Containers optimisés + CDN

### Variables d'Environnement
- `DATABASE_URL`: PostgreSQL connection
- `BETTER_AUTH_SECRET`: JWT signing key
- `BETTER_AUTH_URL`: Base URL application
- `REDIS_URL`: Cache et sessions

### Monitoring
- **Logs**: Structured logging tous environnements
- **Métriques**: Performance API + UI
- **Erreurs**: Sentry error tracking
- **Health checks**: Endpoints santé application