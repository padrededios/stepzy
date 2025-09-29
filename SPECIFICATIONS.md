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
- **Sidebar**: Navigation globale (Mes Activités, Mes Statistiques, Mon Profil, Administration pour admin)
- **DashboardLayout**: Interface moderne "page-in-page" unifiée sur toutes les pages
- **Menu utilisateur**: Dropdown correctement positionné sous l'avatar
- **Responsive**: Mobile-first, adaptable desktop avec breakpoints optimisés

### Pages Principales

#### Mes Activités (/mes-activites)
- **Accueil**: Toutes les activités multisports disponibles
- **Filtrage**: Par sport, statut, disponibilité
- **Actions rapides**: Inscription/désinscription directe
- **Gestion temporelle**: Masquage automatique activités expirées

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

### Composants Réutilisables
- **MatchCard**: Affichage compact activité avec actions multisports
- **Avatar**: Fallback automatique DiceBear avec génération déterministe
- **NotificationCenter**: Dropdown notifications dans header avec badge
- **DashboardLayout**: Layout unifié avec sidebar et header
- **ProtectedRoute**: HOC protection routes avec gestion rôles
- **LoadingStates**: Feedback visuel pour toutes actions async
- **ErrorHandling**: Messages d'erreur contextuels et user-friendly

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