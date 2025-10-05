# Assets Partagés

Ce dossier contient les assets (images, icônes, etc.) partagés entre les différentes applications frontales du monorepo.

## Structure

```
public/
└── images/
    ├── fox_football.jpg      # Icône Football
    ├── fox_badminton.png     # Icône Badminton
    ├── fox_volley.png        # Icône Volleyball
    ├── fox_pingpong.png      # Icône Ping-Pong
    ├── fox_rugbypng.png      # Icône Rugby
    ├── stepzy_logo.png       # Logo Stepzy
    └── stepzy_menu.png       # Icône menu
```

## Utilisation

Les assets de ce dossier sont automatiquement synchronisés vers les applications frontales via le script `sync-assets.sh`.

### Applications cibles

- ✅ **web-app** (application utilisateur) → `packages/web-app/public/images/`
- 🔜 **admin-app** (dashboard administrateur) → `packages/admin-app/public/images/` (à venir)

### Synchronisation

#### Automatique
Le script `start-dev.sh` synchronise automatiquement les assets au démarrage.

#### Manuelle
Pour synchroniser manuellement les assets :

```bash
npm run sync-assets
```

## Ajouter de nouveaux assets

1. Ajouter les fichiers dans `public/images/`
2. Exécuter `npm run sync-assets` pour les copier vers les frontends
3. Les assets seront accessibles via `/images/nom-fichier.ext` dans chaque frontend

## Note importante

Les fichiers de ce dossier sont la **source de vérité**. Les copies dans les packages frontaux (`packages/*/public/images/`) sont générées automatiquement et ne doivent **pas être modifiées directement**.
