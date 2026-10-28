import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { sendEmailMock, loggerErrorMock } = vi.hoisted(() => ({
  sendEmailMock: vi.fn(),
  loggerErrorMock: vi.fn(),
}))

vi.mock('@/services/customerPortalEmail.service', () => ({
  sendAppointmentCancellationEmail: sendEmailMock,
}))
vi.mock('@/lib/logger', () => ({
  logger: { error: loggerErrorMock },
}))

import { sendAppointmentCancellationNotification } from '@/services/appointmentCancellationNotification.service'

const cancellation = {
  organizationId: 'org-1',
  recipientEmail: 'client@example.test',
  cancelledBy: 'CUSTOMER' as const,
  cancelledAt: new Date('2026-10-01T07:00:00.000Z'),
  appointment: {
    id: 'appointment-1',
    startTime: new Date('2026-10-04T08:30:00.000Z'),
    endTime: new Date('2026-10-04T09:30:00.000Z'),
    createdAt: new Date('2026-09-30T12:00:00.000Z'),
    calendarSequence: 2,
    serviceName: 'Coupe',
    organizationName: 'Atelier',
    timezone: 'Europe/Paris',
    organizationSlug: 'atelier',
  },
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.test')
  vi.mocked(sendEmailMock).mockResolvedValue(undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('sendAppointmentCancellationNotification', () => {
  it('sends to the available address with a higher calendar sequence', async () => {
    const result = await sendAppointmentCancellationNotification({
      cancellation,
      requestOrigin: 'https://request.example.test',
    })

    expect(result).toEqual({ notificationSent: true })
    expect(sendEmailMock).toHaveBeenCalledWith({
      to: 'client@example.test',
      cancelledBy: 'CUSTOMER',
      portalUrl: 'https://app.example.test/portail/atelier/mes-rdv',
      appointment: expect.objectContaining({
        sequence: 3,
        calendarMethod: 'CANCEL',
        lastModified: cancellation.cancelledAt,
        portalUrl: 'https://app.example.test/portail/atelier/mes-rdv',
      }),
    })
  })

  it('does not send when no customer address is available', async () => {
    const result = await sendAppointmentCancellationNotification({
      cancellation: { ...cancellation, recipientEmail: null },
      requestOrigin: 'https://request.example.test',
    })

    expect(result).toEqual({
      notificationSent: false,
      notificationWarning: 'Le rendez-vous a été supprimé, mais aucune adresse e-mail client n’est disponible.',
    })
    expect(sendEmailMock).not.toHaveBeenCalled()
  })

  it('does not send cancellation mail for a past appointment', async () => {
    const result = await sendAppointmentCancellationNotification({
      cancellation: {
        ...cancellation,
        appointment: { ...cancellation.appointment, startTime: cancellation.cancelledAt },
      },
      requestOrigin: 'https://request.example.test',
    })

    expect(result).toEqual({ notificationSent: false })
    expect(sendEmailMock).not.toHaveBeenCalled()
  })

  it('reports provider failure without changing the completed cancellation', async () => {
    vi.mocked(sendEmailMock).mockRejectedValueOnce(new Error('Resend unavailable'))

    const result = await sendAppointmentCancellationNotification({
      cancellation,
      requestOrigin: 'https://request.example.test',
    })

    expect(result).toEqual({
      notificationSent: false,
      notificationWarning: 'Le rendez-vous a été supprimé, mais l’e-mail d’annulation n’a pas pu être envoyé.',
    })
    expect(loggerErrorMock).toHaveBeenCalledWith('Appointment cancellation email failed', {
      organizationId: 'org-1',
      appointmentId: 'appointment-1',
      error: expect.any(Error),
    })
  })
})
