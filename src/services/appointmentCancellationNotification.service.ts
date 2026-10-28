import { logger } from '@/lib/logger'
import {
  sendAppointmentCancellationEmail,
  type AppointmentConfirmation,
} from '@/services/customerPortalEmail.service'

export interface AppointmentCancellationData {
  organizationId: string
  recipientEmail: string | null
  cancelledBy: 'CUSTOMER' | 'SALON'
  cancelledAt: Date
  appointment: Omit<AppointmentConfirmation, 'portalUrl'> & {
    calendarSequence: number
    organizationSlug: string | null
  }
}

export type AppointmentCancellationNotificationResult =
  | { notificationSent: true }
  | { notificationSent: false; notificationWarning?: string }

export async function sendAppointmentCancellationNotification(input: {
  cancellation: AppointmentCancellationData
  requestOrigin: string
}): Promise<AppointmentCancellationNotificationResult> {
  const { cancellation } = input
  if (cancellation.appointment.startTime <= cancellation.cancelledAt) {
    return { notificationSent: false }
  }
  if (!cancellation.recipientEmail) {
    return {
      notificationSent: false,
      notificationWarning: 'Le rendez-vous a été supprimé, mais aucune adresse e-mail client n’est disponible.',
    }
  }

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL
    ?? process.env.NEXTAUTH_URL
    ?? input.requestOrigin).replace(/\/+$/, '')
  const { calendarSequence, organizationSlug, ...appointment } = cancellation.appointment
  const portalUrl = organizationSlug
    ? `${baseUrl}/portail/${encodeURIComponent(organizationSlug)}/mes-rdv`
    : null

  try {
    await sendAppointmentCancellationEmail({
      to: cancellation.recipientEmail,
      cancelledBy: cancellation.cancelledBy,
      portalUrl,
      appointment: {
        ...appointment,
        lastModified: cancellation.cancelledAt,
        sequence: calendarSequence + 1,
        calendarMethod: 'CANCEL',
        portalUrl: portalUrl ?? baseUrl,
      },
    })
    return { notificationSent: true }
  } catch (error: unknown) {
    logger.error('Appointment cancellation email failed', {
      organizationId: cancellation.organizationId,
      appointmentId: cancellation.appointment.id,
      error,
    })
    return {
      notificationSent: false,
      notificationWarning: 'Le rendez-vous a été supprimé, mais l’e-mail d’annulation n’a pas pu être envoyé.',
    }
  }
}
