# @stepzy/backend

Backend API REST pour Stepzy - Plateforme multisports

## 🚀 Technologies

- **Framework**: Fastify 5.x
- **Language**: TypeScript 5.x
- **Auth**: Better-auth 1.3.x
- **Database**: PostgreSQL + Prisma ORM
- **Validation**: Zod
- **Cache**: Redis (optionnel)

## 📁 Structure

```
src/
├── index.ts              # Point d'entrée serveur
├── lib/
│   └── auth.ts          # Configuration Better-auth
├── database/
│   └── prisma.ts        # Client Prisma singleton
├── routes/
│   └── auth.routes.ts   # Routes d'authentification
├── middleware/
│   ├── auth.middleware.ts       # Authentification
│   ├── admin.middleware.ts      # Autorisation admin
│   ├── validation.middleware.ts # Validation Zod
│   └── cors.middleware.ts       # Configuration CORS
├── services/            # Logique métier (à venir)
└── ...
```

## 🔧 Installation

```bash
# Depuis la racine du monorepo
npm install

# Générer le client Prisma
npm run db:generate --workspace=@stepzy/backend
```

## 🏃 Développement

```bash
# Démarrer en mode dev avec hot-reload
npm run dev --workspace=@stepzy/backend

# Build TypeScript
npm run build --workspace=@stepzy/backend

# Type-check sans build
npm run type-check --workspace=@stepzy/backend

# Lint
npm run lint --workspace=@stepzy/backend
```

## 🗄️ Base de données

```bash
# Générer le client Prisma
npm run db:generate --workspace=@stepzy/backend

# Pousser le schema vers la DB
npm run db:push --workspace=@stepzy/backend

# Seed la base de données
npm run db:seed --workspace=@stepzy/backend

# Ouvrir Prisma Studio
npm run db:studio --workspace=@stepzy/backend
```

## 🔐 Authentification

L'API utilise **Better-auth** avec des sessions basées sur des cookies :

- `POST /api/auth/sign-in/email` - Connexion
- `POST /api/auth/sign-up/email` - Inscription
- `POST /api/auth/sign-out` - Déconnexion
- `GET /api/auth/session` - Obtenir la session actuelle

### Middlewares

```typescript
import { requireAuth, requireAdmin } from './middleware'

// Route protégée
fastify.get('/api/protected', {
  preHandler: requireAuth
}, async (request) => {
  return { user: request.user }
})

// Route admin
fastify.get('/api/admin/users', {
  preHandler: [requireAuth, requireAdmin]
}, async () => {
  // ...
})
```

## 🌍 Variables d'environnement

Copier `.env.example` vers `.env` et configurer :

```env
PORT=3001
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3001"
WEB_APP_URL="http://localhost:3000"
ADMIN_APP_URL="http://localhost:3002"
```

## 📡 API Endpoints

### Health Check
- `GET /health` - Status du serveur
- `GET /api` - Info API

### Authentication (Better-auth)
- `POST /api/auth/sign-in/email` - Connexion
- `POST /api/auth/sign-up/email` - Inscription
- `POST /api/auth/sign-out` - Déconnexion
- `GET /api/auth/session` - Session actuelle

### Activities
- `GET /api/activities` - Liste des activités (filtres, pagination)
- `POST /api/activities` - Créer une activité
- `GET /api/activities/:id` - Détail activité
- `PUT /api/activities/:id` - Modifier activité
- `DELETE /api/activities/:id` - Supprimer activité
- `POST /api/activities/:id/subscribe` - S'abonner à une activité
- `DELETE /api/activities/:id/subscribe` - Se désabonner
- `GET /api/activities/my-created` - Mes activités créées
- `GET /api/activities/my-participations` - Mes participations
- `GET /api/activities/upcoming-sessions` - Sessions à venir

### Sessions
- `GET /api/sessions/:id` - Détail session
- `PUT /api/sessions/:id` - Modifier session
- `POST /api/sessions/:id/join` - Rejoindre session
- `POST /api/sessions/:id/leave` - Quitter session

### Users
- `GET /api/users/me` - Mon profil
- `GET /api/users/:id` - Profil utilisateur
- `PUT /api/users/profile` - Modifier mon profil
- `GET /api/users/:id/stats` - Statistiques utilisateur
- `GET /api/users/:id/activities` - Activités utilisateur
- `PUT /api/users/preferences` - Modifier préférences

### Admin (requires root role)
- `GET /api/admin/users` - Liste tous les utilisateurs
- `GET /api/admin/users/:id` - Détail utilisateur
- `PUT /api/admin/users/:id` - Modifier utilisateur
- `DELETE /api/admin/users/:id` - Supprimer utilisateur
- `GET /api/admin/statistics` - Statistiques plateforme
- `GET /api/admin/activity-logs` - Logs d'activité

## 🧪 Tests

```bash
# Tests unitaires
npm run test --workspace=@stepzy/backend

# Tests avec coverage
npm run test:coverage --workspace=@stepzy/backend
```

## 🚢 Déploiement

```bash
# Build production
npm run build --workspace=@stepzy/backend

# Démarrer en production
npm run start --workspace=@stepzy/backend
```

## 📝 License

Private
