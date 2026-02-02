# Comptes de test - Base de données

## Compte administrateur (root)
- **Email** : `admin@stepzy.local`
- **Mot de passe** : `RootPass123!`
- **Pseudo** : Admin
- **Rôle** : root

## Comptes utilisateurs de test
- **Email** : `player1@test.com`
  - **Mot de passe** : `password123`
  - **Pseudo** : Player1
  - **Rôle** : user

- **Email** : `player2@test.com`
  - **Mot de passe** : `password123`
  - **Pseudo** : Player2
  - **Rôle** : user

- **Email** : `player3@test.com`
  - **Mot de passe** : `password123`
  - **Pseudo** : Player3
  - **Rôle** : user

## Notes
- Les comptes sont créés via le script `prisma/seed.ts`
- Les utilisateurs de test ont des avatars générés automatiquement via DiceBear
- Pour recréer les comptes : `npm run db:seed`