/**
 * Email Notification System
 * Basic email notifications for match creation and updates
 */

export interface EmailNotification {
  to: string[]
  subject: string
  htmlContent: string
  textContent: string
}

export interface MatchNotificationData {
  matchId: string
  date: Date
  maxPlayers: number
  description?: string
  type: 'created' | 'updated' | 'cancelled' | 'reminder'
  recipients: Array<{
    email: string
    pseudo: string
  }>
}

/**
 * Generates email content for match notifications
 */
export function generateMatchNotificationEmail(data: MatchNotificationData): EmailNotification {
  const { matchId, date, maxPlayers, description, type, recipients } = data
  
  const matchDateFormatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)

  const subjects = {
    created: '🏅 Nouvelle activité sportive disponible !',
    updated: '📝 Mise à jour de l\'activité sportive',
    cancelled: '❌ Activité sportive annulée',
    reminder: '⏰ Rappel : Activité sportive demain'
  }

  const subject = subjects[type]

  const htmlContent = generateHtmlContent(type, matchDateFormatted, matchId, maxPlayers, description)
  const textContent = generateTextContent(type, matchDateFormatted, matchId, maxPlayers, description)

  return {
    to: recipients.map(r => r.email),
    subject,
    htmlContent,
    textContent
  }
}

function generateHtmlContent(
  type: string, 
  matchDate: string, 
  matchId: string, 
  maxPlayers: number, 
  description?: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const matchUrl = `${baseUrl}/matches/${matchId}`

  const typeMessages = {
    created: {
      title: 'Nouveau match disponible !',
      message: 'Un nouveau match de futsal vient d\'être créé.',
      action: 'Réserver ma place'
    },
    updated: {
      title: 'Match mis à jour',
      message: 'Les détails du match ont été modifiés.',
      action: 'Voir les détails'
    },
    cancelled: {
      title: 'Match annulé',
      message: 'Malheureusement, ce match a été annulé.',
      action: 'Voir d\'autres matchs'
    },
    reminder: {
      title: 'Match demain !',
      message: 'N\'oubliez pas votre match de futsal.',
      action: 'Voir le match'
    }
  }

  const typeConfig = typeMessages[type as keyof typeof typeMessages]

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${typeConfig.title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7fafc; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🥅 Futsal Club</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">${typeConfig.title}</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
            ${typeConfig.message}
          </p>

          <!-- Match Details -->
          <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 15px 0; color: #2d3748; font-size: 18px;">Détails du match</h3>
            <p style="margin: 5px 0; color: #4a5568;"><strong>📅 Date :</strong> ${matchDate}</p>
            <p style="margin: 5px 0; color: #4a5568;"><strong>👥 Places :</strong> ${maxPlayers} joueurs maximum</p>
            ${description ? `<p style="margin: 5px 0; color: #4a5568;"><strong>📝 Description :</strong> ${description}</p>` : ''}
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="${matchUrl}" style="display: inline-block; background-color: #667eea; color: white; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; font-size: 16px;">
              ${typeConfig.action}
            </a>
          </div>

          <!-- Footer info -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
            <p style="color: #718096; font-size: 14px; margin: 0;">
              Vous recevez cet email car vous êtes membre du club de futsal.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateTextContent(
  type: string, 
  matchDate: string, 
  matchId: string, 
  maxPlayers: number, 
  description?: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const matchUrl = `${baseUrl}/matches/${matchId}`

  const typeMessages = {
    created: 'Nouveau match de futsal disponible !',
    updated: 'Match de futsal mis à jour',
    cancelled: 'Match de futsal annulé',
    reminder: 'Rappel : Match de futsal demain'
  }

  const title = typeMessages[type as keyof typeof typeMessages]

  return `
${title}

Détails du match :
- Date : ${matchDate}
- Places : ${maxPlayers} joueurs maximum
${description ? `- Description : ${description}` : ''}

Lien vers le match : ${matchUrl}

---
Vous recevez cet email car vous êtes membre du club de futsal.
  `.trim()
}

/**
 * Simulates sending an email (in a real app, this would integrate with an email service)
 */
export async function sendNotificationEmail(notification: EmailNotification): Promise<boolean> {
  // In development, just log the email
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email Notification:', {
      to: notification.to,
      subject: notification.subject,
      preview: notification.textContent.substring(0, 100) + '...'
    })
    return true
  }

  // In production, this would integrate with services like:
  // - SendGrid
  // - Mailgun
  // - AWS SES
  // - Resend
  try {
    // TODO: Implement actual email sending
    // await emailService.send(notification)
    return true
  } catch (error) {
    console.error('Error sending email notification:', error)
    return false
  }
}

/**
 * Sends notifications for match events
 */
export async function sendMatchNotification(data: MatchNotificationData): Promise<void> {
  if (data.recipients.length === 0) {
    console.log('No recipients for match notification')
    return
  }

  const notification = generateMatchNotificationEmail(data)
  const success = await sendNotificationEmail(notification)

  if (success) {
    console.log(`✅ Match notification sent to ${data.recipients.length} recipients (${data.type})`)
  } else {
    console.error(`❌ Failed to send match notification (${data.type})`)
  }
}