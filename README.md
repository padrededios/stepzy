# 🏅 Stepzy - Plateforme Multisports

Plateforme web moderne pour la gestion et réservation d'activités sportives multiples (Football, Badminton, Volleyball, Ping-Pong, Rugby). Développée avec Next.js, TypeScript, et une approche TDD complète.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/username/stepzy)
[![Test Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)](https://github.com/username/stepzy)
[![Version](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com/username/stepzy)
[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/username/stepzy/blob/main/LICENSE)

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#-technologies)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Tests](#-tests)
- [Déploiement](#-déploiement)
- [Contribution](#-contribution)
- [Support](#-support)
- [Licence](#-licence)

## ✨ Fonctionnalités

### 🔐 Authentification & Sécurité
- Inscription/connexion sécurisée avec Better-auth
- Sessions chiffrées avec cookies HTTPOnly
- Validation stricte des mots de passe
- Rate limiting anti-brute force
- Protection XSS et injection SQL

### 🏅 Gestion des activités multisports récurrentes
- Création d'activités récurrentes par les utilisateurs (Football, Badminton, Volleyball, Ping-Pong, Rugby)
- Système de récurrence hebdomadaire/mensuelle
- Génération automatique des sessions à venir
- Inscription/désinscription aux activités et sessions
- Sélection visuelle du sport avec icônes dédiées
- Adaptation automatique du nombre de joueurs par sport
- Système de liste d'attente automatique par session
- Promotion FIFO depuis la liste d'attente
- Configuration spécifique par sport (min/max joueurs)

### 👥 Profils utilisateur
- Profils personnalisés avec avatar
- Historique complet des activités sportives
- Statistiques de participation par sport
- Système de badges et récompenses multisports
- Préférences de notifications

### 🎯 Gestion temporelle intelligente
- Fermeture automatique des inscriptions 15 minutes avant l'activité
- Masquage des activités expirées pour éviter les inscriptions tardives
- Nettoyage automatique des activités terminées
- Archivage intelligent des données anciennes (30+ jours)

### 🔔 Système de notifications moderne
- **Toast notifications** : Design moderne avec dégradés de couleurs
- Notifications success/error/info avec animations élégantes
- Centre de notifications interactif dans header
- Notifications push navigateur
- Rappels automatiques (24h et 2h avant)
- Annonces administrateur avec priorités
- Templates email personnalisables

### 🛡️ Administration
- Panel d'administration complet
- Gestion des utilisateurs (recherche, filtres)
- Statistiques temps réel avec graphiques
- Création et gestion des matchs
- Système d'annonces globales

### 📱 Interface utilisateur moderne
- Design "page-in-page" unifié avec DashboardLayout persistant
- Layout Groups Next.js `(dashboard)` pour éviter re-renders
- Hook `useCurrentUser()` avec Context API
- Interface mobile-first responsive
- Menu utilisateur correctement positionné
- Navigation sidebar globale sur toutes les pages
- Toast notifications modernes avec animations
- Accessibilité WCAG 2.1 AA complète
- Support navigation clavier et screen readers

### 🏗️ Code Quality & Architecture
- Types TypeScript centralisés (`/src/types/`)
- Fonctions utilitaires consolidées (`/src/lib/utils/`)
- API client HTTP unifié
- Imports absoluts systématiques (`@/`)
- Zero code mort, interfaces optimisées
- Architecture modulaire et maintenable

## 🛠️ Technologies

### Frontend
- **Next.js 15** (App Router) - Framework React
- **TypeScript** - Typage statique
- **Tailwind CSS v4** - Framework CSS utilitaire
- **React 18** - Bibliothèque UI

### Backend
- **Better-auth 1.3.8** - Authentification sécurisée
- **Prisma ORM** - Base de données ORM
- **PostgreSQL** - Base de données relationnelle
- **Redis** - Cache et sessions

### DevOps & Qualité
- **Docker** - Conteneurisation
- **Jest** - Tests unitaires
- **Testing Library** - Tests composants
- **Playwright** - Tests E2E
- **ESLint + Prettier** - Qualité code

### Monitoring
- **Structured logging** - Logs JSON structurés
- **Metrics collection** - Métriques Prometheus
- **Health checks** - Monitoring système
- **Performance tracking** - Suivi performances

## 🚀 Installation

### Prérequis

- **Node.js** 20+ (recommandé : 20.10.0)
- **npm** 10+ ou **yarn** 1.22+
- **Docker** & **Docker Compose**
- **PostgreSQL** 15+ (via Docker ou local)
- **Redis** 7+ (via Docker ou local)

### Installation rapide

```bash
# Cloner le repository
git clone https://github.com/username/stepzy.git
cd stepzy

# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env.local

# Démarrer les services (PostgreSQL + Redis)
docker-compose up -d

# Initialiser la base de données
npx prisma migrate dev
npx prisma db seed

# Démarrer le serveur de développement
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

### Compte administrateur par défaut

```
Email: admin@stepzy.local
Mot de passe: RootPass123!
```

## ⚙️ Configuration

### Variables d'environnement

Copiez `.env.example` vers `.env.local` et configurez :

```bash
# Base de données
DATABASE_URL="postgresql://futsal_user:futsal_pass@localhost:5432/futsal_dev"

# Redis (optionnel, fallback mémoire)
REDIS_URL="redis://localhost:6379"

# Better-auth
BETTER_AUTH_SECRET="votre-clé-secrète-très-longue-ici"
BETTER_AUTH_URL="http://localhost:3000"

# Email (optionnel en développement)
SENDGRID_API_KEY="votre-clé-sendgrid"
SENDGRID_FROM_EMAIL="noreply@votre-domaine.com"

# Features
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_CACHE=true
```

### Configuration Docker

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f app

# Arrêter les services
docker-compose down
```

## 📖 Utilisation

### Pour les utilisateurs

1. **Inscription** : Créez un compte avec email et mot de passe fort
2. **S'inscrire** : Consultez toutes les activités récurrentes disponibles
3. **Inscription activité** : Inscrivez-vous aux activités et leurs sessions
4. **Mes Activités** : Gérez vos participations avec onglets (participations, disponibles, historique)
5. **Créer activité** : Créez vos propres activités récurrentes
6. **Mon Profil** : Consultez vos statistiques et historique
7. **Notifications** : Toast modernes + centre notifications dans le header

### Pour les administrateurs

1. **Connexion admin** : Utilisez le compte root par défaut
2. **Créer activités** : Planifiez les créneaux multisports
3. **Gestion utilisateurs** : Administrez les comptes
4. **Statistiques** : Consultez les métriques d'usage
5. **Annonces** : Communiquez avec la communauté

## 🏗️ Architecture

### Structure du projet

```
src/
├── app/                    # App Router Next.js
│   ├── (dashboard)/       # Layout Group pour pages authentifiées
│   │   ├── layout.tsx    # Layout persistant avec ProtectedRoute
│   │   ├── mes-activites/ # Page participations
│   │   ├── s-inscrire/   # Page catalogue activités
│   │   ├── create-activity/ # Création activités récurrentes
│   │   ├── profile/      # Page profil utilisateur
│   │   ├── notifications/ # Page centre notifications
│   │   └── admin/        # Pages administration
│   └── api/              # API Routes (auth, activities, sessions, admin)
├── components/            # Composants React
│   ├── auth/             # Authentification (LoginForm, RegisterForm)
│   ├── matches/          # Gestion activités (MatchCard, MatchView)
│   ├── layout/           # Layout (Header, Sidebar, DashboardLayout, ProtectedRoute)
│   ├── notifications/    # Notifications (NotificationCenter)
│   ├── profile/          # Profil (UserProfile, UserBadges)
│   ├── admin/            # Administration (UserList, Statistics)
│   └── ui/               # UI primitives (Toast)
├── hooks/                 # Custom React Hooks
│   ├── useCurrentUser.ts # Hook Context pour utilisateur
│   ├── useActivities.ts  # Hook gestion activités
│   └── useRecurringActivities.ts # Hook activités récurrentes
├── lib/                   # Utilitaires
│   ├── auth/             # Better-auth configuration
│   ├── utils/            # Utilitaires consolidés (date, API client)
│   ├── services/         # Services métier (activity-session, cleanup)
│   └── notifications/    # Services notifications
├── types/                 # Types TypeScript centralisés
│   ├── user.ts           # Types utilisateur
│   ├── match.ts          # Types activités (legacy)
│   ├── activity.ts       # Types activités récurrentes
│   └── index.ts          # Re-exports
└── __tests__/            # Tests (134+ tests, 95%+ coverage)
    ├── unit/             # Tests unitaires
    ├── integration/      # Tests intégration API
    ├── e2e/              # Tests E2E Playwright
    └── accessibility/    # Tests accessibilité
```

### Flux de données

```
User → Next.js → Better-auth → Prisma → PostgreSQL
                      ↓
                    Redis Cache
                      ↓
                 Metrics & Logs
```

## 📚 API Documentation

Documentation complète disponible via Swagger UI :

- **Développement** : [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Production** : [https://api.futsal.app/docs](https://api.futsal.app/docs)
- **Spec OpenAPI** : [`docs/api-specification.yaml`](docs/api-specification.yaml)

### Endpoints principaux

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/auth/register` | POST | Inscription utilisateur |
| `/api/auth/login` | POST | Connexion |
| `/api/matches` | GET | Liste des matchs |
| `/api/matches/{id}/join` | POST | Inscription match |
| `/api/notifications` | GET | Notifications utilisateur |
| `/api/admin/users` | GET | Gestion utilisateurs (admin) |
| `/api/health` | GET | État de santé |

## 🧪 Tests

### Commandes de test

```bash
# Tests unitaires
npm test

# Tests avec couverture
npm run test:coverage

# Tests E2E
npm run test:e2e

# Tests de performance
npm run test:performance

# Tous les tests
npm run test:all
```

### Couverture actuelle

- **Unitaires** : 95%+ (134+ tests)
- **Intégration** : 90%+ (API routes)
- **E2E** : Parcours complets utilisateur
- **Performance** : <200ms API, load testing
- **Accessibilité** : WCAG 2.1 AA

### Types de tests

- ✅ **Tests unitaires** : Logique métier, composants
- ✅ **Tests intégration** : API, base de données
- ✅ **Tests E2E** : Parcours utilisateur complets
- ✅ **Tests régression** : Prévention bugs récurrents
- ✅ **Tests accessibilité** : Navigation clavier, screen readers
- ✅ **Tests performance** : Temps de réponse, montée en charge
- ✅ **Tests responsive** : Mobile, tablet, desktop

## 🚀 Déploiement

### Production avec Docker

```bash
# Build image production
docker build -f Dockerfile.production -t futsal-app .

# Déployer avec compose
docker-compose -f docker-compose.production.yml up -d

# Migrations production
docker exec futsal-app npx prisma migrate deploy
```

### Variables production

Configurez `.env.production` avec :

```bash
# Base de données production
DATABASE_URL="postgresql://user:pass@db:5432/futsal_prod"

# Redis production
REDIS_URL="redis://redis:6379"

# Sécurité
BETTER_AUTH_SECRET="clé-très-sécurisée-production"
BETTER_AUTH_URL="https://votre-domaine.com"

# Email production
SENDGRID_API_KEY="clé-production"
SENDGRID_FROM_EMAIL="noreply@votre-domaine.com"

# Monitoring
SENTRY_DSN="https://votre-sentry-dsn"
LOG_LEVEL="info"
```

### Nginx (recommandé)

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Monitoring production

- **Health check** : `/api/health`
- **Métriques** : `/api/metrics` (Prometheus)
- **Logs** : JSON structuré via stdout
- **Alertes** : Sentry pour erreurs critiques

## 🤝 Contribution

Nous accueillons les contributions ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour :

- Guide de contribution
- Standards de code
- Process de review
- Types de contributions acceptées

### Développement

```bash
# Fork le projet
git checkout -b feature/ma-fonctionnalite

# Écrire les tests d'abord (TDD)
npm test -- --watch

# Implémenter la fonctionnalité
# ...

# Vérifier la qualité
npm run lint
npm run type-check
npm run test:coverage

# Commiter et pusher
git commit -m "feat: ajouter ma fonctionnalité"
git push origin feature/ma-fonctionnalite

# Créer une Pull Request
```

## 📞 Support

### Documentation

- **Guide utilisateur** : [docs/user-guide.md](docs/user-guide.md)
- **Guide admin** : [docs/admin-guide.md](docs/admin-guide.md)
- **FAQ** : [docs/faq.md](docs/faq.md)
- **Troubleshooting** : [docs/troubleshooting.md](docs/troubleshooting.md)

### Contact

- **Issues** : [GitHub Issues](https://github.com/username/futsal/issues)
- **Discussions** : [GitHub Discussions](https://github.com/username/futsal/discussions)
- **Email** : support@futsal.app
- **Documentation** : [docs.futsal.app](https://docs.futsal.app)

### Statut du service

- **Status page** : [status.futsal.app](https://status.futsal.app)
- **API Status** : `/api/health`

## 🏆 Crédits

### Équipe

- **Développement** : Architecture TDD, Next.js, TypeScript
- **Design** : Interface responsive, UX/UI
- **DevOps** : Docker, monitoring, déploiement
- **QA** : Tests exhaustifs, performance, sécurité

### Technologies utilisées

Merci à tous les mainteneurs des bibliothèques open source utilisées :

- [Next.js](https://nextjs.org/) - Framework React
- [Better-auth](https://better-auth.com/) - Authentification
- [Prisma](https://prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [Et bien d'autres...](package.json)

## 📄 Licence

Ce projet est sous licence MIT. Voir [LICENSE](LICENSE) pour plus de détails.

```
MIT License

Copyright (c) 2024 Futsal App

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

**🚀 Prêt à pratiquer du multisport ?** [Commencez maintenant](http://localhost:3000) ou consultez la [documentation complète](docs/).

Made with ❤️ and 🏅 for the multisports community.
