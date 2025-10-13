# 📚 Libraries Documentation

Ce document liste toutes les librairies utilisées dans le projet monorepo (v4.0) avec leurs fonctionnalités principales pour éviter la réimplémentation de fonctions existantes.

## 📦 Architecture Monorepo

**Structure actuelle** :
- `packages/backend/` - API Fastify standalone (port 3001)
- `packages/web-app/` - Frontend Next.js (port 3000)
- `packages/shared/` - Code partagé (types, constants, utils)

## 🚀 Backend - Fastify Framework

**Fichier**: `packages/backend/src/index.ts`

### Fonctionnalités principales:
- `fastify()` - Créer instance serveur Fastify
- `app.get()`, `app.post()`, `app.put()`, `app.delete()` - Définir routes HTTP
- `app.register()` - Enregistrer plugins et routes
- `app.addHook()` - Ajouter hooks lifecycle (onRequest, preHandler, etc.)
- `app.listen()` - Démarrer serveur avec port
- `app.close()` - Fermer serveur proprement

### Middleware disponibles:
- `@fastify/cors` - Configuration CORS multi-origine
- `@fastify/helmet` - Sécurité headers HTTP
- `@fastify/cookie` - Gestion cookies
- `@fastify/rate-limit` - Rate limiting par route

### Types Fastify:
```typescript
import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
```

## 🔐 Authentication - Better-auth v1.3.8

**Fichiers Backend**: `packages/backend/src/lib/auth.ts`, `packages/backend/src/middleware/auth.middleware.ts`
**Fichiers Frontend**: `packages/web-app/src/lib/auth/` (client-side)

### Fonctions principales:
- `auth.api.signUp()` - Inscription utilisateur avec validation email/password
- `auth.api.signIn()` - Connexion avec vérification des credentials  
- `auth.api.signOut()` - Déconnexion et nettoyage de session
- `auth.api.getSession()` - Récupération de la session utilisateur courante
- `auth.api.updateUser()` - Mise à jour des informations utilisateur
- `auth.api.changePassword()` - Changement de mot de passe avec validation
- `auth.api.deleteUser()` - Suppression de compte utilisateur
- `auth.api.sendVerificationEmail()` - Envoi d'email de vérification
- `auth.api.verifyEmail()` - Vérification d'email avec token
- `auth.api.sendPasswordResetEmail()` - Envoi d'email de reset de mot de passe
- `auth.api.resetPassword()` - Reset de mot de passe avec token
- `auth.api.revokeSession()` - Révocation de session spécifique
- `auth.api.listSessions()` - Liste de toutes les sessions utilisateur

### Fonctions admin:
- `auth.api.admin.createUser()` - Création d'utilisateur par admin
- `auth.api.admin.deleteUser()` - Suppression d'utilisateur par admin
- `auth.api.admin.listUsers()` - Liste de tous les utilisateurs
- `auth.api.admin.updateUser()` - Mise à jour de données utilisateur par admin

### Plugins inclus:
- Rate limiting (protection contre brute force)
- Admin management
- Email/password authentication
- OpenAPI documentation

---

## 🗄️ Database - Prisma ORM

**Fichier**: `packages/backend/src/database/prisma.ts`
**Schema**: `packages/backend/prisma/schema.prisma`

### Méthodes CRUD (pour chaque modèle: user, match, matchPlayer, notification):
- `prisma.model.findUnique()` - Trouver un enregistrement unique
- `prisma.model.findMany()` - Trouver plusieurs enregistrements avec filtrage
- `prisma.model.create()` - Créer un nouvel enregistrement
- `prisma.model.update()` - Mettre à jour un enregistrement existant
- `prisma.model.delete()` - Supprimer un enregistrement
- `prisma.model.upsert()` - Mettre à jour ou créer un enregistrement
- `prisma.model.count()` - Compter les enregistrements correspondant aux critères
- `prisma.model.aggregate()` - Effectuer des agrégations sur les données
- `prisma.model.groupBy()` - Grouper les enregistrements par champ

### Méthodes de transaction:
- `prisma.$transaction()` - Exécuter plusieurs opérations atomiquement
- `prisma.$executeRaw()` - Exécuter des requêtes SQL brutes
- `prisma.$queryRaw()` - Exécuter des requêtes SQL avec retour

### Méthodes de connexion:
- `prisma.$connect()` - Se connecter manuellement à la base de données
- `prisma.$disconnect()` - Se déconnecter manuellement de la base de données

---

## 🚀 Cache - Redis v4+

**Fichier**: `packages/backend/src/lib/cache/redis.ts`

### Opérations de base:
- `client.get()` - Récupérer une valeur string par clé
- `client.set()` - Définir une valeur string avec clé
- `client.setEx()` - Définir une valeur avec temps d'expiration
- `client.del()` - Supprimer une ou plusieurs clés
- `client.exists()` - Vérifier si une clé existe
- `client.keys()` - Trouver des clés correspondant à un motif
- `client.expire()` - Définir un temps d'expiration pour une clé
- `client.ttl()` - Obtenir le temps de vie d'une clé

### Opérations Hash:
- `client.hGet()` - Récupérer la valeur d'un champ dans un hash
- `client.hSet()` - Définir la valeur d'un champ dans un hash
- `client.hGetAll()` - Récupérer tous les champs et valeurs d'un hash
- `client.hDel()` - Supprimer des champs d'un hash
- `client.hExists()` - Vérifier si un champ existe dans un hash

### Opérations List:
- `client.lPush()` - Pousser un élément en tête de liste
- `client.rPush()` - Pousser un élément en queue de liste
- `client.lPop()` - Récupérer et supprimer l'élément en tête
- `client.rPop()` - Récupérer et supprimer l'élément en queue
- `client.lRange()` - Récupérer une plage d'éléments de la liste

### CacheManager personnalisé:
- `cache.get()` - Récupération avec désérialisation JSON automatique
- `cache.set()` - Stockage avec sérialisation JSON et TTL
- `cache.getOrSet()` - Pattern cache-aside avec fonction de fallback
- `cache.deletePattern()` - Suppression par motif de clés
- Fallback mémoire en développement

---

## 🔔 Notifications - Service complet

**Fichier**: `packages/backend/src/lib/notifications/service.ts`

### Gestion des notifications:
- `createNotification()` - Créer une nouvelle notification pour un utilisateur
- `createBulkNotifications()` - Créer des notifications pour plusieurs utilisateurs
- `getNotifications()` - Récupérer les notifications utilisateur avec pagination
- `getUnreadCount()` - Obtenir le nombre de notifications non lues
- `markAsRead()` - Marquer une notification comme lue
- `markAllAsRead()` - Marquer toutes les notifications utilisateur comme lues
- `deleteNotification()` - Supprimer une notification spécifique
- `deleteOldNotifications()` - Nettoyage des anciennes notifications

### Intégration email:
- `sendMatchNotification()` - Envoyer des notifications de match par email
- `sendWelcomeEmail()` - Envoyer un email de bienvenue
- `sendPasswordResetEmail()` - Envoyer un email de reset de mot de passe
- `sendMatchReminderEmail()` - Envoyer un rappel de match 24h avant

### Types de notifications supportés:
- `match_created` - Nouveau match disponible
- `match_updated` - Détails du match modifiés
- `match_cancelled` - Match annulé
- `match_reminder` - Rappel de match à venir
- `match_joined` - Utilisateur rejoint un match
- `match_left` - Utilisateur quitte un match
- `waiting_list_promoted` - Promu de la liste d'attente
- `announcement` - Annonces administrateur
- `system` - Notifications système

---

## ⚛️ React Hooks

**Fichiers**: `packages/web-app/src/hooks/`

### Hooks React disponibles:
- `useState()` - Gérer l'état des composants
- `useEffect()` - Effectuer des effets de bord
- `useCallback()` - Mémoriser des fonctions pour éviter les re-renders
- `useMemo()` - Mémoriser des valeurs calculées
- `useReducer()` - Gestion d'état complexe alternative
- `useRef()` - Accéder aux éléments DOM ou persister des valeurs
- `useContext()` - Consommer le contexte React
- `useLayoutEffect()` - Effets synchrones avant le paint DOM
- `useImperativeHandle()` - Personnaliser l'exposition des refs
- `useDebugValue()` - Étiqueter les hooks personnalisés dans DevTools

### Hook useAuth personnalisé:
- `user` - Utilisateur authentifié courant ou null
- `loading` - Boolean indiquant une vérification d'auth en cours
- `error` - Message d'erreur si les opérations d'auth échouent
- `login()` - Fonction pour authentifier un utilisateur
- `logout()` - Fonction pour déconnecter l'utilisateur courant
- `refreshUser()` - Fonction pour rafraîchir les données utilisateur

### Hook useCurrentUser personnalisé:
**Fichier**: `packages/web-app/src/hooks/useCurrentUser.ts`
- Accès utilisateur via Context API sans props drilling
- `user` - Utilisateur authentifié depuis le contexte
- Simplifie l'architecture en évitant la transmission de props

### Hook useActivities personnalisé:
**Fichier**: `packages/web-app/src/hooks/useActivities.ts`
- `createdActivities` - Activités créées par l'utilisateur
- `participationActivities` - Activités auxquelles l'utilisateur participe (upcoming/past)
- `availableSessions` - Sessions disponibles pour inscription
- `joinSession(sessionId)` - Rejoindre une session avec mise à jour optimiste
- `leaveSession(sessionId)` - Quitter une session avec mise à jour optimiste
- `fetchCreatedActivities()` - Recharger les activités créées
- `fetchParticipations()` - Recharger les participations
- `fetchAvailableSessions()` - Recharger les sessions disponibles
- **Optimisation**: Mise à jour locale des états au lieu de rechargement complet
- **Performance**: Aucune requête API pour rafraîchir l'UI après join/leave

---

## 📦 Shared Package (@stepzy/shared)

**Fichier**: `packages/shared/`

### Types TypeScript:
- `packages/shared/types/user.types.ts` - User, UserStats, AuthUser, etc.
- `packages/shared/types/activity.types.ts` - Activity, Session, Participant, etc.
- `packages/shared/types/api.types.ts` - ApiResponse, ApiError, etc.

### Constants:
- `packages/shared/constants/sports.config.ts` - SPORTS_CONFIG avec configuration sports
- `packages/shared/constants/routes.ts` - Routes API centralisées

### Utilitaires:
- `packages/shared/utils/date.utils.ts` - formatDate, formatTime, parseDate
- `packages/shared/utils/validation.utils.ts` - Validateurs réutilisables

### Import depuis shared:
```typescript
import { User, Activity } from '@stepzy/shared/types'
import { SPORTS_CONFIG } from '@stepzy/shared/constants'
import { formatDate } from '@stepzy/shared/utils'
```

---

## 📦 Next.js v15 - Framework React

**Package**: `packages/web-app/`

### Composants et fonctions disponibles:
- `Image` - Composant d'image optimisé avec lazy loading
- `Link` - Navigation côté client avec prefetching
- `useRouter()` - Hook de navigation programmatique
- `useSearchParams()` - Hook pour accéder aux paramètres d'URL
- `usePathname()` - Hook pour obtenir le chemin courant
- `redirect()` - Redirection côté serveur
- `notFound()` - Afficher la page 404
- `revalidatePath()` - Revalider le cache d'une page
- `revalidateTag()` - Revalider le cache par tag

### API Routes (App Router):
- Support des méthodes HTTP (GET, POST, PUT, DELETE, PATCH)
- Middleware pour l'authentification et la validation
- Gestion des erreurs avec try/catch
- Réponses JSON avec `Response.json()`
- Headers personnalisés et cookies

---

## 🛣️ Routing - Next.js App Router

**Système de routage intégré à Next.js v15**

### Navigation côté client:
- `import Link from 'next/link'` - Composant de navigation avec prefetching
- `<Link href="/path">` - Navigation vers une route
- `<Link href="/users/[id]" as="/users/123">` - Routes dynamiques
- `router.push('/path')` - Navigation programmatique
- `router.replace('/path')` - Remplacer l'entrée d'historique
- `router.back()` - Retour en arrière
- `router.forward()` - Avancer dans l'historique
- `router.refresh()` - Rafraîchir la page courante

### Hooks de routage:
```javascript
import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation'

// Navigation programmatique
const router = useRouter()
router.push('/dashboard')
router.replace('/login')

// Chemin courant
const pathname = usePathname() // "/dashboard"

// Paramètres d'URL
const searchParams = useSearchParams()
const id = searchParams.get('id')

// Paramètres de route dynamique
const params = useParams()
const userId = params.userId // Pour /users/[userId]
```

### Routes dynamiques:
- `[id]` - Route dynamique simple (/users/123)
- `[...slug]` - Catch-all routes (/blog/a/b/c)
- `[[...slug]]` - Optional catch-all (/shop ou /shop/clothes)
- `(group)` - Groupement de routes sans affecter l'URL
- `@modal` - Parallel routes pour les modals

### Génération de routes:
- `generateStaticParams()` - Génération de paramètres statiques (SSG)
- `generateMetadata()` - Génération de métadonnées dynamiques
- `generateViewport()` - Configuration du viewport

### Redirection et réecriture:
```javascript
// Dans page.tsx ou layout.tsx
import { redirect, notFound, permanentRedirect } from 'next/navigation'

// Redirection temporaire (307)
redirect('/login')

// Redirection permanente (308)
permanentRedirect('/new-url')

// Page 404
notFound()
```

### Middleware de routage:
```javascript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Redirection conditionnelle
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Réécriture d'URL
  if (request.nextUrl.pathname === '/old-path') {
    return NextResponse.rewrite(new URL('/new-path', request.url))
  }
  
  // Headers personnalisés
  const response = NextResponse.next()
  response.headers.set('x-custom-header', 'value')
  return response
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*']
}
```

### Patterns de routage disponibles dans le projet:
- `/` - Page d'accueil
- `/login` - Page de connexion
- `/register` - Page d'inscription  
- `/dashboard` - Tableau de bord utilisateur
- `/profile` - Page profil utilisateur
- `/matches/[id]` - Détail d'un match
- `/admin` - Administration (protected)
- `/admin/users` - Gestion des utilisateurs
- `/admin/matches` - Gestion des matches
- `/api/auth/[...all]` - API d'authentification Better-auth
- `/api/matches` - API des matches
- `/api/users` - API des utilisateurs

---

## 🎨 Tailwind CSS v4 - Framework CSS

### Classes utilitaires disponibles:
- **Layout**: `flex`, `grid`, `absolute`, `relative`, `fixed`, `sticky`
- **Spacing**: `p-4`, `m-2`, `space-x-4`, `gap-2`
- **Typography**: `text-lg`, `font-bold`, `text-center`, `leading-tight`
- **Colors**: `bg-blue-500`, `text-red-600`, `border-gray-200`
- **Interactive**: `hover:bg-blue-700`, `focus:ring-2`, `active:scale-95`
- **Responsive**: `md:flex`, `lg:grid-cols-3`, `sm:text-base`
- **Dark mode**: `dark:bg-gray-800`, `dark:text-white`

### Composants personnalisés:
Utiliser les classes existantes plutôt que de créer du CSS personnalisé.

---

## 🔧 Utilitaires supplémentaires

### Validation:
- **Zod** pour la validation de schémas TypeScript (backend et frontend)
- **Better-auth validators** pour la validation d'auth

### Backend Utils:
- **Export** dans `packages/backend/src/lib/utils/export.ts`
- **Time constraints** dans `packages/backend/src/lib/utils/time-constraints.ts`

### Monitoring (Backend):
- **Métriques** dans `packages/backend/src/lib/monitoring/metrics.ts`
- **Logging** dans `packages/backend/src/lib/logging/logger.ts`

### Turborepo:
- **turbo.json** - Configuration builds parallèles
- Commandes: `npm run dev`, `npm run build`, `npm run test`
- Filtres: `--filter=backend`, `--filter=web-app`, `--filter=shared`

---

## 💡 Conseils d'utilisation

1. **Toujours vérifier** si une fonction existe déjà avant d'en créer une nouvelle
2. **Consulter ce fichier** et les commentaires dans le code pour connaître les fonctions disponibles
3. **Utiliser les patterns établis** (ex: cache.getOrSet, prisma.$transaction)
4. **Réutiliser les types** depuis `@stepzy/shared` plutôt que d'en créer de nouveaux
5. **Suivre les conventions** de nommage et d'organisation du monorepo
6. **Backend vs Frontend** : Séparer clairement la logique (backend API, frontend UI)
7. **Shared package** : Mettre le code réutilisable dans `packages/shared/`
8. **Scripts Turbo** : Utiliser `npm run dev` pour lancer tous les packages en parallèle

## 🔧 Scripts de Développement

### Démarrage:
```bash
./start-dev.sh           # Démarre backend + web-app + Docker
./start-dev.sh --reset   # Réinitialise la DB
./start-dev.sh --init    # Réinitialise et seed la DB
```

### Arrêt:
```bash
./stop-dev.sh            # Arrête tous les services proprement
# ou Ctrl+C dans start-dev.sh (gestion propre des signaux)
```

### Développement ciblé:
```bash
npm run dev:backend      # Backend seul (port 3001)
npm run dev:web          # Web-app seul (port 3000)
```

Ce document sera mis à jour au fur et à mesure de l'ajout de nouvelles librairies et de l'évolution de l'architecture.