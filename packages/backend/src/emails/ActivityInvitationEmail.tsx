/**
 * Email template for activity invitation
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components'
import * as React from 'react'

interface ActivityInvitationEmailProps {
  activityName: string
  sportName: string
  creatorName: string
  activityCode: string
  inviteLink: string
  recurringDays: string[]
  recurringType: string
  startTime: string
  endTime: string
  maxPlayers: number
}

export const ActivityInvitationEmail = ({
  activityName = 'Ping-Pong du samedi',
  sportName = 'Ping-Pong',
  creatorName = 'John',
  activityCode = 'ABC12345',
  inviteLink = 'http://localhost:3000/join/ABC12345',
  recurringDays = ['Samedi'],
  recurringType = 'hebdomadaire',
  startTime = '14:00',
  endTime = '16:00',
  maxPlayers = 8,
}: ActivityInvitationEmailProps) => {
  const formattedCode = activityCode.match(/.{1,4}/g)?.join(' ') || activityCode

  return (
    <Html>
      <Head />
      <Preview>
        {creatorName} t'invite à rejoindre {activityName} sur Stepzy
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={headerTitle}>Stepzy</Heading>
            <Text style={headerSubtitle}>Organisez vos activités sportives</Text>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Heading style={h1}>🎉 Nouvelle invitation !</Heading>

            <Text style={text}>
              <strong>{creatorName}</strong> t'invite à rejoindre une activité sportive sur Stepzy.
            </Text>

            {/* Activity card */}
            <Section style={activityCard}>
              <Heading style={activityName_style}>{activityName}</Heading>
              <Text style={activityDetail}>
                <strong>Sport :</strong> {sportName}
              </Text>
              <Text style={activityDetail}>
                <strong>Récurrence :</strong> {recurringDays.join(', ')} ({recurringType})
              </Text>
              <Text style={activityDetail}>
                <strong>Horaires :</strong> {startTime} - {endTime}
              </Text>
              <Text style={activityDetail}>
                <strong>Joueurs :</strong> Jusqu'à {maxPlayers} par session
              </Text>
            </Section>

            {/* Code section */}
            <Section style={codeSection}>
              <Text style={codeLabel}>Code d'invitation</Text>
              <Text style={codeValue}>{formattedCode}</Text>
              <Text style={codeHint}>
                Copie ce code et colle-le dans l'application
              </Text>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={inviteLink}>
                Rejoindre l'activité
              </Button>
            </Section>

            <Text style={linkText}>
              Ou copie ce lien dans ton navigateur :
              <br />
              <Link href={inviteLink} style={link}>
                {inviteLink}
              </Link>
            </Text>

            <Hr style={hr} />

            {/* Footer */}
            <Text style={footer}>
              Tu as reçu cet email car {creatorName} t'a invité à rejoindre une activité sur Stepzy.
              <br />
              Si tu ne souhaites pas rejoindre cette activité, tu peux ignorer cet email.
            </Text>

            <Text style={footer}>
              © 2025 Stepzy - Tous droits réservés
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ActivityInvitationEmail

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  padding: '32px 48px',
  backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  textAlign: 'center' as const,
}

const headerTitle = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
}

const headerSubtitle = {
  color: '#ffffff',
  fontSize: '14px',
  margin: '8px 0 0 0',
  opacity: 0.9,
}

const content = {
  padding: '0 48px',
}

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '32px 0 16px',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const activityCard = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #e5e7eb',
}

const activityName_style = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
}

const activityDetail = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
}

const codeSection = {
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '2px solid #3b82f6',
}

const codeLabel = {
  color: '#1e40af',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
}

const codeValue = {
  color: '#1e3a8a',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '8px 0',
  fontFamily: 'monospace',
  letterSpacing: '0.1em',
}

const codeHint = {
  color: '#3b82f6',
  fontSize: '12px',
  margin: '8px 0 0 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
}

const linkText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  textAlign: 'center' as const,
}

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
}

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '16px 0',
  textAlign: 'center' as const,
}
