# 🔑 Codes d'Activité de Test

**Date de génération :** 2025-11-01
**Environnement :** Développement local

---

## 📋 Codes disponibles pour les tests

Utilisez ces codes pour tester la fonctionnalité de rejoindre une activité par code dans la page "S'inscrire".

### 🏀 Football du mardi
- **Code :** `RMJKL01B`
- **Sport :** Football
- **Créateur :** Player1
- **Jours :** Mardi
- **Horaire :** 18:30 - 20:00
- **Joueurs :** 8-12
- **Description :** Match de football hebdomadaire tous les mardis

### 🏸 Badminton du mercredi
- **Code :** `QD4Z62Z9`
- **Sport :** Badminton
- **Créateur :** Player2
- **Jours :** Mercredi
- **Horaire :** 19:00 - 20:00
- **Joueurs :** 2-4
- **Description :** Badminton en double tous les mercredis

### 🏐 Volleyball du jeudi
- **Code :** `TEA27HIZ`
- **Sport :** Volleyball
- **Créateur :** Player3
- **Jours :** Jeudi
- **Horaire :** 17:00 - 19:00
- **Joueurs :** 6-12
- **Description :** Match de volleyball tous les jeudis

### 🏓 Ping-Pong du samedi
- **Code :** `9ZQ0KGJU`
- **Sport :** Ping-Pong
- **Créateur :** Admin
- **Jours :** Samedi
- **Horaire :** 14:00 - 15:30
- **Joueurs :** 2-8
- **Description :** Tournoi de ping-pong tous les samedis

---

## 🧪 Scénarios de test

### Test 1 : Rejoindre une activité avec un code valide
1. Se connecter en tant que `player2@test.com` (mot de passe: `password123`)
2. Aller sur la page "S'inscrire"
3. Cliquer sur "Rejoindre avec un code"
4. Entrer le code : `RMJKL01B` (Football)
5. **Résultat attendu :** Message de succès "Vous avez rejoint l'activité Football du mardi"

### Test 2 : Code invalide
1. Cliquer sur "Rejoindre avec un code"
2. Entrer un code inexistant : `INVALID1`
3. **Résultat attendu :** Message d'erreur "Code d'activité invalide"

### Test 3 : Rejoindre une activité dont on est déjà membre
1. Se connecter en tant que `player1@test.com` (créateur du Football)
2. Essayer de rejoindre avec le code : `RMJKL01B`
3. **Résultat attendu :** Message "Vous êtes déjà membre de cette activité"

### Test 4 : Copier le code d'une activité créée
1. Se connecter en tant que `player1@test.com`
2. Aller sur "S'inscrire"
3. Trouver l'activité "Football du mardi"
4. Cliquer sur "📋 Copier le code"
5. **Résultat attendu :** Message "Code copié !" et code `RMJKL01B` dans le presse-papier

### Test 5 : Partager par email
1. Se connecter en tant que créateur d'une activité
2. Cliquer sur "📧 Inviter par email"
3. Entrer une adresse email de test
4. **Résultat attendu :** Email envoyé avec le code et le lien d'invitation

---

## 🔍 Format des codes

- **Longueur :** 8 caractères
- **Caractères autorisés :** A-Z, 0-9 (majuscules uniquement)
- **Regex de validation :** `^[A-Z0-9]{8}$`
- **Exemples valides :**
  - `A1B2C3D4`
  - `RMJKL01B`
  - `9ZQ0KGJU`
- **Exemples invalides :**
  - `abc12345` (minuscules)
  - `A1B2` (trop court)
  - `A1B2-C3D4` (caractères spéciaux)

---

## 📝 Notes

- Ces codes sont générés automatiquement lors de la création d'une activité
- Chaque code est unique dans la base de données
- Les codes ne changent jamais une fois créés
- Les codes sont sensibles à la casse (majuscules uniquement)

---

## 🔄 Regénérer les codes de test

Si vous avez besoin de regénérer la base de données de test avec de nouveaux codes :

```bash
cd packages/backend
npm run db:seed
```

Puis récupérer les nouveaux codes avec :

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getActivityCodes() {
  const activities = await prisma.activity.findMany({
    select: { name: true, code: true }
  });
  activities.forEach(a => console.log(\`\${a.name}: \${a.code}\`));
}

getActivityCodes().then(() => process.exit(0));
"
```

---

**Dernière mise à jour :** 2025-11-01
