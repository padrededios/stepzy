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
- **Horaires**: Uniquement créneaux 12h-14h (midi-deux)
- **Capacité**: Maximum 12 joueurs par match (6v6)
- **Liste d'attente**: Illimitée, promotion FIFO
- **Validation**: Un utilisateur = un slot par match maximum

## 🖥️ Interface Utilisateur

### Layout & Navigation
- **Header**: Logo, navigation, menu utilisateur avec avatar
- **Sidebar**: Navigation contextuelle (masqué sur mobile)
- **Footer**: Liens légaux et informations
- **Responsive**: Mobile-first, adaptable desktop

### Pages Principales

#### Dashboard (/)
- **Accueil**: Matchs semaine courante + suivante
- **Statistiques**: Nombre de matchs confirmés/en attente
- **Actions rapides**: Rejoindre/quitter directement

#### Vue Match Détaillée (/matches/[id])
- **Layout terrain**: Style MPG avec positions 6v6
- **Joueurs confirmés**: Avatars sur les positions
- **Banc d'attente**: Liste d'attente avec positions
- **Actions**: Clics avatars pour se désinscrire

#### Administration (/admin)
- **Gestion utilisateurs**: CRUD complet, réinitialisation mots de passe
- **Gestion matchs**: Création, modification, inscriptions forcées
- **Statistiques globales**: Vue d'ensemble activité

### Composants Réutilisables
- **MatchCard**: Affichage compact match avec actions
- **Avatar**: Fallback automatique DiceBear
- **LoadingStates**: Feedback visuel toutes actions
- **ErrorHandling**: Messages d'erreur contextuels
- **Notifications**: Toast pour confirmations/erreurs

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

## 📅 Contraintes Temporelles

### Horaires Métier
- **Créneaux**: Exclusivement 12h00-14h00
- **Jours**: Lundi à Vendredi (jours ouvrés)
- **Anticipation**: Réservation jusqu'à 2 semaines à l'avance
- **Limite**: Annulation jusqu'à 2h avant le match

### Sessions Utilisateur
- **Durée**: 7 jours par défaut
- **Renouvellement**: Automatique si activité
- **Sécurité**: Invalidation si changement IP/navigateur suspect

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