# 📧 Configuration de l'envoi d'emails

Ce guide explique comment configurer et tester l'envoi d'emails d'invitation pour les activités.

## 🎨 Template React Email

Les templates d'email sont créés avec [React Email](https://react.email), une bibliothèque qui permet de créer des emails HTML compatibles avec tous les clients email en utilisant des composants React.

### Template disponible

- **ActivityInvitationEmail** (`src/emails/ActivityInvitationEmail.tsx`)
  - Email d'invitation à rejoindre une activité
  - Contient le code d'invitation formaté
  - Bouton CTA pour rejoindre directement
  - Lien de secours
  - Design responsive et professionnel

## 🚀 Configuration en développement

Par défaut, en mode développement, le serveur utilise **MailHog** (port 1025) pour capturer les emails sans les envoyer réellement.

### Option 1: Installer MailHog (recommandé)

MailHog est un serveur SMTP de test qui capture tous les emails et les affiche dans une interface web.

**Installation:**

```bash
# Ubuntu/Debian
sudo apt-get install mailhog

# macOS avec Homebrew
brew install mailhog

# Ou avec Go
go install github.com/mailhog/MailHog@latest
```

**Démarrage:**

```bash
mailhog
```

L'interface web sera accessible sur: http://localhost:8025

### Option 2: Utiliser Ethereal Email (sans installation)

Si vous ne voulez pas installer MailHog, vous pouvez utiliser [Ethereal](https://ethereal.email) qui génère des comptes temporaires SMTP pour les tests.

Modifiez `src/services/email.service.ts` pour utiliser Ethereal:

```typescript
// Dans getTransporter(), mode développement:
const testAccount = await nodemailer.createTestAccount()

this.transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: testAccount.user,
    pass: testAccount.pass,
  },
})
```

## 🏭 Configuration en production

Pour envoyer de vrais emails en production, configurez les variables d'environnement suivantes:

### Variables d'environnement

Créez un fichier `.env` dans `packages/backend/`:

```env
# Email configuration
NODE_ENV=production
SMTP_HOST=smtp.exemple.com        # Serveur SMTP (ex: smtp.gmail.com, smtp.sendgrid.net)
SMTP_PORT=587                      # Port SMTP (587 pour TLS, 465 pour SSL)
SMTP_SECURE=false                  # true pour port 465, false pour 587
SMTP_USER=votre-email@exemple.com  # Utilisateur SMTP
SMTP_PASS=votre-mot-de-passe       # Mot de passe SMTP
EMAIL_FROM=Stepzy <noreply@stepzy.app>  # Adresse d'expédition

# Frontend URL (pour les liens dans les emails)
FRONTEND_URL=https://stepzy.app
```

### Services SMTP recommandés

1. **SendGrid** (gratuit jusqu'à 100 emails/jour)
   - https://sendgrid.com
   - Configuration simple via API key

2. **Mailgun** (gratuit jusqu'à 5000 emails/mois)
   - https://www.mailgun.com
   - Bon pour les emails transactionnels

3. **Gmail SMTP** (pour tests uniquement)
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Note: Nécessite un "App Password" si 2FA activé

## 🧪 Tester l'envoi d'emails

### Via l'interface web

1. Créez une activité (vous devez être le créateur)
2. Cliquez sur le bouton **"Email"** dans le code d'invitation
3. Entrez une adresse email de test
4. Cliquez sur **"Envoyer"**
5. Vérifiez l'email dans:
   - MailHog: http://localhost:8025
   - Ethereal: Vérifiez la console pour le lien de prévisualisation

### Via l'API directement

```bash
# Avec curl (nécessite une session authentifiée)
curl -X POST http://localhost:3001/api/activities/{activityId}/send-invitation \
  -H "Content-Type: application/json" \
  -H "Cookie: votre-cookie-session" \
  -d '{"email":"test@example.com"}'
```

### Script de test

Créez un script de test dans `packages/backend/scripts/test-email.ts`:

```typescript
import { EmailService } from '../src/services/email.service'

async function testEmail() {
  const result = await EmailService.sendActivityInvitation('test@example.com', {
    activityName: 'Ping-Pong du samedi',
    sportName: 'Ping-Pong',
    creatorName: 'John Doe',
    activityCode: 'ABC12345',
    inviteLink: 'http://localhost:3000/join/ABC12345',
    recurringDays: ['Samedi'],
    recurringType: 'hebdomadaire',
    startTime: '14:00',
    endTime: '16:00',
    maxPlayers: 8
  })

  console.log('Result:', result)
}

testEmail()
```

Exécutez:
```bash
npx tsx scripts/test-email.ts
```

## 🎨 Prévisualiser les templates

React Email fournit un outil de développement pour prévisualiser les templates:

```bash
# Dans packages/backend
npx email dev
```

Cela lancera un serveur sur http://localhost:3000 où vous pourrez voir et modifier vos templates en temps réel.

## 📝 Personnaliser les templates

Les templates sont dans `src/emails/`. Pour créer un nouveau template:

1. Créez un fichier `.tsx` dans `src/emails/`
2. Utilisez les composants React Email
3. Exportez le composant comme fonction
4. Utilisez-le via `EmailService`

Exemple de structure:

```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Text,
} from '@react-email/components'

interface MyEmailProps {
  name: string
}

export const MyEmail = ({ name }: MyEmailProps) => {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Heading>Bonjour {name}!</Heading>
          <Text>Ceci est un email de test.</Text>
        </Container>
      </Body>
    </Html>
  )
}
```

## 🐛 Dépannage

### Les emails ne sont pas envoyés

1. Vérifiez que MailHog est en cours d'exécution (port 1025)
2. Vérifiez les logs du serveur backend
3. Vérifiez la configuration SMTP dans `.env`

### Les emails vont dans les spams

En production, assurez-vous de:
- Configurer SPF et DKIM pour votre domaine
- Utiliser un service SMTP réputé (SendGrid, Mailgun)
- Ajouter un lien de désinscription (requis par la loi)
- Éviter les mots-clés spam dans le contenu

### Erreur "ECONNREFUSED"

MailHog n'est pas démarré ou ne tourne pas sur le bon port. Vérifiez:
```bash
ss -tlnp | grep 1025
```

## 📚 Ressources

- [React Email Documentation](https://react.email/docs)
- [Nodemailer Documentation](https://nodemailer.com/)
- [MailHog GitHub](https://github.com/mailhog/MailHog)
- [Ethereal Email](https://ethereal.email/)
