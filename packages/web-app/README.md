# @stepzy/web-app

Frontend Next.js pour Stepzy - Plateforme multisports

## 🚀 Technologies

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS v4
- **Auth**: Better-auth client
- **State**: React hooks
- **API**: Client HTTP custom + wrappers typés

## 📁 Structure

```
src/
├── app/                      # Pages Next.js (App Router)
│   ├── (auth)/              # Pages auth (login, register)
│   ├── (dashboard)/         # Pages dashboard (layout persistant)
│   └── layout.tsx           # Layout root
├── components/              # Composants UI
│   ├── activities/         # Composants activités
│   ├── layout/             # Layout composants (Header, Sidebar)
│   └── ui/                 # Composants UI réutilisables
├── hooks/                   # React hooks custom
│   └── useCurrentUser.tsx  # Hook pour user context
├── lib/
│   ├── api/                # API client & wrappers
│   │   ├── client.ts       # Client HTTP de base
│   │   ├── auth.api.ts     # Auth wrapper (Better-auth)
│   │   ├── activities.api.ts
│   │   ├── sessions.api.ts
│   │   ├── users.api.ts
│   │   └── index.ts        # Exports centralisés
│   ├── hooks/              # Hooks utilitaires
│   ├── notifications/      # Système de notifications/toasts
│   └── utils/              # Fonctions utilitaires
└── types/                   # Types TypeScript (legacy, migrer vers @stepzy/shared)
```

## 🔧 Installation

```bash
# Depuis la racine du monorepo
npm install

# Ou depuis packages/web-app
npm install
```

## 🏃 Développement

```bash
# Démarrer le serveur de dev
npm run dev --workspace=@stepzy/web-app

# Build pour production
npm run build --workspace=@stepzy/web-app

# Type-check sans build
npm run type-check --workspace=@stepzy/web-app

# Lint
npm run lint --workspace=@stepzy/web-app

# Tests
npm run test --workspace=@stepzy/web-app
```

## 🌍 Variables d'environnement

Copier `.env.example` vers `.env.local` :

```env
# API Backend URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# Better-auth URL (backend)
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3001
```

## 📡 API Client

### Utilisation basique

```typescript
import { apiClient } from '@/lib/api/client'

// GET request
const response = await apiClient.get('/api/endpoint')

// POST request
const response = await apiClient.post('/api/endpoint', { data })
```

### Wrappers API

```typescript
import { activitiesApi, authApi, sessionsApi, usersApi } from '@/lib/api'

// Activities
const activities = await activitiesApi.getAll({ sport: 'football' })
const activity = await activitiesApi.getById('id')
await activitiesApi.create(data)

// Auth (Better-auth)
await authApi.signIn({ email, password })
await authApi.signUp({ email, password, pseudo })
await authApi.signOut()
const session = await authApi.getSession()

// Sessions
await sessionsApi.join('sessionId')
await sessionsApi.leave('sessionId')

// Users
const user = await usersApi.getMe()
const stats = await usersApi.getStats('userId')
await usersApi.updateProfile(data)
```

### Hook Better-auth

```typescript
import { useSession } from '@/lib/api'

function MyComponent() {
  const { data: session, isPending } = useSession()
  
  if (isPending) return <div>Loading...</div>
  if (!session) return <div>Not authenticated</div>
  
  return <div>Hello {session.user.pseudo}</div>
}
```

## 🔐 Authentication

Le web-app utilise **Better-auth client** qui communique avec le backend via cookies de session :

1. **Sign In**: `authApi.signIn({ email, password })`
2. **Session**: Cookie `stepzy.session-token` géré automatiquement
3. **Protected Routes**: Hook `useSession()` pour vérifier auth
4. **Sign Out**: `authApi.signOut()`

## 🎨 Composants

### Layout

- **Header**: Navigation principale
- **Sidebar**: Menu dashboard
- **Layout Groups**: `(auth)` et `(dashboard)` pour layouts persistants

### Activities

- **ActivityCard**: Carte activité
- **ActivityList**: Liste activités
- **ActivityForm**: Formulaire création/édition
- **SessionCard**: Carte session

### UI

Composants réutilisables basés sur Tailwind CSS

## 📝 Conventions

### Imports

```typescript
// Préférer les imports depuis @stepzy/shared
import type { Activity, User } from '@stepzy/shared'

// API wrappers
import { activitiesApi, authApi } from '@/lib/api'

// Composants
import { ActivityCard } from '@/components/activities/ActivityCard'
```

### API Calls

```typescript
// Toujours gérer les erreurs
const response = await activitiesApi.getAll()

if (!response.success) {
  console.error(response.error)
  return
}

const { activities } = response.data
```

## 🚢 Déploiement

```bash
# Build production
npm run build --workspace=@stepzy/web-app

# Démarrer en production
npm run start --workspace=@stepzy/web-app
```

### Vercel

Le web-app est conçu pour être déployé sur Vercel :

1. Connecter le repo GitHub
2. Configurer les variables d'environnement
3. Deploy automatique sur chaque push

## 📝 TODO

- [ ] Migrer types de `src/types` vers `@stepzy/shared`
- [ ] Adapter toutes les pages pour utiliser les nouveaux wrappers API
- [ ] Remplacer tous les `fetch('/api/...')` par les wrappers
- [ ] Tests E2E avec Playwright
- [ ] Optimisation bundle size

## 📝 License

Private
