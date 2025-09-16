# ADR-001: Adoption Next.js App Router

## Statut
✅ Accepté

## Date
2024-01-15

## Contexte

Le projet nécessitait un framework React moderne capable de gérer :
- Le rendu côté serveur (SSR) pour les performances SEO
- Le routing basé sur le système de fichiers
- Les API routes intégrées pour éviter un backend séparé
- Une architecture scalable pour une application SaaS
- Un écosystème mature avec une communauté active

Les options considérées étaient :
- Next.js avec App Router (v13+)
- Next.js avec Pages Router (legacy)
- Remix
- Vite + React Router
- Create React App (SPA uniquement)

## Décision

Adoption de **Next.js 15 avec App Router** comme framework principal.

L'App Router de Next.js offre :
- Architecture basée sur les composants React Server
- Layouts hiérarchiques et imbriqués
- Streaming et Suspense natifs
- Co-localisation des composants, styles et logique
- API routes intégrées avec middleware
- Support TypeScript excellent
- Optimisations automatiques (images, fonts, scripts)

## Conséquences

### Positives
- **Performance** : SSR/SSG natif, streaming, optimisations automatiques
- **DX (Developer Experience)** : Hot reload, TypeScript, debugging intégré
- **Architecture** : Structure claire avec app/ directory, layouts partagés
- **Écosystème** : Intégrations tierces nombreuses, documentation complète
- **Déploiement** : Compatible Vercel, Docker, plateforme-agnostique
- **SEO** : Rendu serveur natif, métadonnées dynamiques
- **Sécurité** : CSRF protection, CSP headers, validation automatique

### Négatives
- **Courbe d'apprentissage** : App Router plus complexe que Pages Router
- **Vendor lock-in partiel** : Certaines optimisations spécifiques Next.js
- **Taille bundle** : Plus lourd qu'une SPA pure
- **Complexité SSR** : Gestion des états client/serveur délicate
- **Migration future** : Breaking changes potentiels entre versions majeures

### Neutres
- **Convention over configuration** : Moins de flexibilité, plus de structure
- **Écosystème React** : Dépendance aux évolutions React Server Components
- **Performance runtime** : Trade-off entre SSR benefits et complexité

## Alternatives considérées

### Remix
- **Avantages** : Focus sur les standards web, nested routing élégant
- **Inconvénients** : Écosystème moins mature, moins d'optimisations built-in
- **Rejet** : Communauté plus petite, moins de ressources disponibles

### Vite + React Router
- **Avantages** : Build ultra-rapide, configuration flexible, moderne
- **Inconvénients** : Pas de SSR natif, configuration manuelle requise
- **Rejet** : Nécessiterait trop de configuration pour fonctionnalités SaaS

### Create React App
- **Avantages** : Simplicité, SPA pure, bundle léger
- **Inconvénients** : Pas de SSR, SEO limité, pas d'API routes
- **Rejet** : Insuffisant pour les besoins d'une application SaaS complète

### Next.js Pages Router
- **Avantages** : Mature, stable, documentation extensive
- **Inconvénients** : Architecture moins moderne, pas de layouts natifs
- **Rejet** : App Router représente l'avenir de Next.js

## Impact sur l'architecture

```
┌─────────────────────────┐
│     app/ directory      │
├─────────────────────────┤
│  layout.tsx (racine)    │
│  page.tsx (home)        │
│  dashboard/             │
│    ├─ layout.tsx       │
│    └─ page.tsx         │
│  matches/               │
│    ├─ [id]/            │
│    │   └─ page.tsx     │
│    └─ page.tsx         │
│  admin/                 │
│    ├─ layout.tsx       │
│    ├─ users/           │
│    └─ statistics/      │
│  api/                   │
│    ├─ auth/            │
│    ├─ matches/         │
│    └─ health/          │
└─────────────────────────┘
```

## Métriques de succès

- **Performance** : Lighthouse score >90 sur tous les axes
- **SEO** : Indexation Google complète, métadonnées correctes
- **DX** : Hot reload <2s, build time <30s en dev
- **Bundle** : First Load JS <250KB
- **Core Web Vitals** : LCP <2.5s, FID <100ms, CLS <0.1

## Validation

### Tests de performance
```bash
npm run build
npm run start
npx lighthouse http://localhost:3000 --view
```

### SEO validation
```bash
curl -I http://localhost:3000
# Vérifier headers SSR, métadonnées
```

### Developer Experience
```bash
npm run dev
# Mesurer temps hot reload, TypeScript checking
```

## Évolution prévue

- **Next.js 16** : Migration vers nouvelles fonctionnalités React
- **React Server Components** : Adoption progressive des patterns avancés  
- **Edge Runtime** : Migration selective vers edge functions
- **Streaming** : Implémentation progressive pour améliorer TTFB

## Références

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)  
- [Next.js Performance Best Practices](https://nextjs.org/docs/basic-features/performance)
- [Vercel Deployment Guide](https://vercel.com/docs/concepts/next.js)
- [Issue GitHub #127](https://github.com/username/futsal/issues/127) - Framework Selection Discussion