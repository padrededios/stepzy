# 🏃 Codes d'Activités pour Tests

Ce fichier contient les codes d'activités disponibles pour tester la fonctionnalité **"Rejoindre une activité par code"**.

---

## 📋 Codes Disponibles

### 1. 🏓 Ping-Pong du samedi
- **Code:** `84FDFA31`
- **Sport:** Ping-Pong
- **Créateur:** Admin (admin@stepzy.local)
- **Récurrence:** Hebdomadaire - Samedi
- **Horaires:** 14:00 - 15:30
- **Joueurs:** Jusqu'à 8 joueurs par session

---

### 2. 🏐 Volleyball du jeudi
- **Code:** `441AC17E`
- **Sport:** Volleyball
- **Créateur:** Player3 (player3@test.com)
- **Récurrence:** Hebdomadaire - Jeudi
- **Horaires:** 17:00 - 19:00
- **Joueurs:** Jusqu'à 12 joueurs par session

---

### 3. 🏸 Badminton du mercredi
- **Code:** `0CA1B5F4`
- **Sport:** Badminton
- **Créateur:** Player2 (player2@test.com)
- **Récurrence:** Hebdomadaire - Mercredi
- **Horaires:** 19:00 - 20:00
- **Joueurs:** Jusqu'à 4 joueurs par session

---

### 4. ⚽ Football du mardi
- **Code:** `92FCF31C`
- **Sport:** Football
- **Créateur:** Player1 (player1@test.com)
- **Récurrence:** Hebdomadaire - Mardi
- **Horaires:** 18:30 - 20:00
- **Joueurs:** Jusqu'à 12 joueurs par session

---

## 🧪 Guide de Test

### Scénario 1 : Rejoindre une nouvelle activité

1. Connectez-vous avec un compte test (voir `TEST_ACCOUNTS.md`)
2. Allez sur la page **"S'inscrire"** (http://localhost:3000/s-inscrire)
3. Cliquez sur la carte **"Rejoindre avec un code"**
4. Entrez un code (par exemple : `84FDFA31`)
5. Cliquez sur **"Vérifier"** pour prévisualiser l'activité
6. Cliquez sur **"Rejoindre"** pour confirmer

**Résultat attendu :** L'activité apparaît dans votre page "S'inscrire" et vous êtes automatiquement inscrit.

---

### Scénario 2 : Tester le code d'une activité déjà rejointe

1. Utilisez un code d'activité que vous avez déjà rejoint
2. La prévisualisation fonctionne normalement
3. En cliquant sur "Rejoindre", vous recevez le message : *"Vous êtes déjà membre de cette activité"*

**Résultat attendu :** Pas de doublon créé, message informatif affiché.

---

### Scénario 3 : Tester le partage du code (créateur)

1. Connectez-vous avec le compte du créateur de l'activité
2. Dans la page "S'inscrire", repérez l'activité que vous avez créée
3. La section **"Code d'invitation"** avec le code formaté doit être visible
4. Testez les 3 boutons :
   - **Code** : Copie le code dans le presse-papiers
   - **Lien** : Copie un lien d'invitation (format: `http://localhost:3000/join/CODE`)
   - **Email** : Ouvre le client email avec un message pré-rempli

**Résultat attendu :** Les 3 actions fonctionnent, feedback visuel affiché.

---

### Scénario 4 : Tester l'inscription/désinscription

1. Rejoignez une activité avec un code
2. Cliquez sur **"Se désinscrire"**
3. Après désinscription, le bouton devient **"S'inscrire"** et une **icône X** (Quitter) apparaît
4. Cliquez sur **"S'inscrire"** à nouveau pour vous réinscrire

**Résultat attendu :** Vous pouvez vous inscrire/désinscrire librement, l'activité reste visible.

---

### Scénario 5 : Quitter définitivement une activité

1. Désinscrivez-vous d'une activité (bouton rouge "Se désinscrire")
2. Une **icône X** grise apparaît à côté du bouton "S'inscrire"
3. Cliquez sur l'icône X et confirmez
4. L'activité disparaît de votre page "S'inscrire"

**Résultat attendu :** L'activité n'est plus visible. Pour la voir à nouveau, vous devez la rejoindre avec son code.

---

### Scénario 6 : Créateur ne peut pas quitter

1. Connectez-vous avec le créateur d'une activité
2. Désinscrivez-vous de votre propre activité
3. L'**icône X n'apparaît PAS** (les créateurs ne peuvent pas quitter leurs activités)
4. Seuls les boutons "S'inscrire" et "Gérer" sont disponibles

**Résultat attendu :** Le créateur peut se désinscrire mais pas quitter définitivement son activité.

---

## 🔄 Régénérer les codes

Si vous avez besoin de mettre à jour ce fichier avec les codes actuels de la base de données :

```bash
cd packages/backend
npx tsx scripts/get-activity-codes.ts
```

---

## 📝 Notes

- Les codes sont **uniques** et **permanents** (8 caractères alphanumériques)
- Format : `[A-Z0-9]{8}` (exemple: `84FDFA31`)
- Les codes sont **insensibles à la casse** côté frontend (automatiquement en majuscules)
- Les espaces sont automatiquement supprimés lors de la saisie
- La prévisualisation montre les informations publiques de l'activité avant de rejoindre

---

## 🔗 Fichiers liés

- **Comptes de test** : `TEST_ACCOUNTS.md`
- **Documentation API** : `API_ROUTES.md`
- **Script de génération** : `scripts/get-activity-codes.ts`
