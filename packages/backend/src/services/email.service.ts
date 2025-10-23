/**
 * Email Service - Handle email sending with React Email templates
 */

import { render } from '@react-email/render'
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import ActivityInvitationEmail from '../emails/ActivityInvitationEmail'

interface ActivityInvitationData {
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

export class EmailService {
  private static transporter: Transporter | null = null

  /**
   * Get or create email transporter
   */
  private static getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter
    }

    // For development, use ethereal.email (fake SMTP)
    // In production, use real SMTP credentials from environment variables
    if (process.env.NODE_ENV === 'production') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    } else {
      // Development: use console logger (emails won't actually be sent)
      // Alternative: use Ethereal.email for testing
      this.transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025, // MailHog default port
        ignoreTLS: true,
      })
    }

    return this.transporter
  }

  /**
   * Send activity invitation email
   */
  static async sendActivityInvitation(
    to: string,
    data: ActivityInvitationData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const emailHtml = render(ActivityInvitationEmail(data))
      const emailText = render(ActivityInvitationEmail(data), {
        plainText: true,
      })

      const transporter = this.getTransporter()

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Stepzy <noreply@stepzy.app>',
        to,
        subject: `${data.creatorName} t'invite à rejoindre ${data.activityName}`,
        html: emailHtml,
        text: emailText,
      })

      console.log('📧 Email sent:', info.messageId)

      // Log preview URL for development (Ethereal)
      if (process.env.NODE_ENV !== 'production') {
        const previewUrl = nodemailer.getTestMessageUrl(info)
        if (previewUrl) {
          console.log('📧 Preview URL:', previewUrl)
        }
      }

      return {
        success: true,
        messageId: info.messageId,
      }
    } catch (error) {
      console.error('❌ Email sending failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Generate email HTML without sending (for preview or mailto)
   */
  static generateActivityInvitationHtml(data: ActivityInvitationData): string {
    return render(ActivityInvitationEmail(data))
  }

  /**
   * Generate plain text email (for mailto or preview)
   */
  static generateActivityInvitationText(data: ActivityInvitationData): string {
    return render(ActivityInvitationEmail(data), { plainText: true })
  }
}
