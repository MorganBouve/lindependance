import { beforeEach, describe, expect, it, vi } from 'vitest'

const { portalServiceMock, appointmentsServiceMock, cancellationNotificationMock } = vi.hoisted(() => ({
  portalServiceMock: { getCustomerPortalSession: vi.fn() },
  appointmentsServiceMock: {
    getCustomerPortalAppointments: vi.fn(),
    cancelCustomerPortalAppointment: vi.fn(),
  },
  cancellationNotificationMock: { sendAppointmentCancellationNotification: vi.fn() },
}))

vi.mock('@/services/customerPortal.service', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/services/customerPortal.service')>(),
  ...portalServiceMock,
}))
vi.mock('@/services/customerPortalAppointments.service', () => appointmentsServiceMock)
vi.mock('@/services/appointmentCancellationNotification.service', () => cancellationNotificationMock)

import { GET } from '@/app/api/portail/rdv/route'
import { DELETE } from '@/app/api/portail/rdv/[id]/route'
import {
  CustomerPortalHttpError,
  getCustomerPortalSession,
} from '@/services/customerPortal.service'
import {
  cancelCustomerPortalAppointment,
  getCustomerPortalAppointments,
} from '@/services/customerPortalAppointments.service'
import { sendAppointmentCancellationNotification } from '@/services/appointmentCancellationNotification.service'

const organizationA = { id: 'org-test-a', slug: 'salon-test-a' }
const organizationB = { id: 'org-test-b', slug: 'salon-test-b' }
const session = {
  accountType: 'CUSTOMER' as const,
  organizationId: organizationA.id,
  verifiedEmail: 'synthetic-customer@example.test',
  expiresAt: Date.now() + 60_000,
}
const routeContext = { params: Promise.resolve({ id: 'appointment-1' }) }
const cancellation = {
  organizationId: organizationA.id,
  recipientEmail: session.verifiedEmail,
  cancelledBy: 'CUSTOMER' as const,
  cancelledAt: new Date('2026-10-01T10:00:00.000Z'),
  appointment: {
    id: 'appointment-1',
    startTime: new Date('2026-10-03T10:00:00.000Z'),
    endTime: new Date('2026-10-03T11:00:00.000Z'),
    createdAt: new Date('2026-09-30T12:00:00.000Z'),
    calendarSequence: 0,
    serviceName: 'Coupe',
    organizationName: 'Atelier',
    timezone: 'Europe/Paris',
    organizationSlug: organizationA.slug,
  },
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getCustomerPortalSession).mockResolvedValue(session)
  vi.mocked(getCustomerPortalAppointments).mockResolvedValue({
    timezone: 'Europe/Paris',
    appointments: [{
      id: 'appointment-1',
      startTime: new Date('2026-10-03T10:00:00.000Z'),
      endTime: new Date('2026-10-03T11:00:00.000Z'),
      status: 'CONFIRMED',
      serviceId: 'service-1',
      staffId: 'staff-1',
      customer: { firstName: 'Camille', lastName: 'Martin' },
      service: { name: 'Coupe' },
      staff: { firstName: 'Alex', lastName: 'Durand' },
      canCancel: true,
      changeRequest: null,
    }],
  })
  vi.mocked(cancelCustomerPortalAppointment).mockResolvedValue(cancellation)
  vi.mocked(sendAppointmentCancellationNotification).mockResolvedValue({ notificationSent: true })
})

describe('GET /api/portail/rdv', () => {
  it('returns a strict customer appointment projection scoped to session identity', async () => {
    const response = await GET(new Request(
      `https://example.test/api/portail/rdv?organizationSlug=${organizationA.slug}&customerId=${organizationB.id}`,
    ))

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(await response.json()).toEqual({
      timezone: 'Europe/Paris',
      appointments: [{
        id: 'appointment-1',
        startTime: '2026-10-03T10:00:00.000Z',
        endTime: '2026-10-03T11:00:00.000Z',
        status: 'CONFIRMED',
        serviceId: 'service-1',
        staffId: 'staff-1',
        customer: { firstName: 'Camille', lastName: 'Martin' },
        service: { name: 'Coupe' },
        staff: { firstName: 'Alex', lastName: 'Durand' },
        canCancel: true,
        changeRequest: null,
      }],
    })
    expect(getCustomerPortalAppointments).toHaveBeenCalledWith({
      organizationId: organizationA.id,
      organizationSlug: organizationA.slug,
      verifiedEmail: 'synthetic-customer@example.test',
    })
  })

  it('rejects an organization A session when the requested portal is organization B', async () => {
    vi.mocked(getCustomerPortalAppointments).mockRejectedValueOnce(
      new CustomerPortalHttpError(404, 'Portal not found'),
    )

    const response = await GET(new Request(
      `https://example.test/api/portail/rdv?organizationSlug=${organizationB.slug}`,
    ))

    expect(response.status).toBe(404)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(await response.json()).toEqual({ error: 'Portal not found' })
    expect(getCustomerPortalAppointments).toHaveBeenCalledWith({
      organizationId: organizationA.id,
      organizationSlug: organizationB.slug,
      verifiedEmail: 'synthetic-customer@example.test',
    })
  })

  it('requires a valid organization slug before querying appointments', async () => {
    const response = await GET(new Request('https://example.test/api/portail/rdv'))

    expect(response.status).toBe(400)
    expect(getCustomerPortalAppointments).not.toHaveBeenCalled()
  })

  it('requires a customer-only session', async () => {
    vi.mocked(getCustomerPortalSession).mockResolvedValueOnce(null)

    const response = await GET(new Request('https://example.test/api/portail/rdv'))

    expect(response.status).toBe(401)
    expect(getCustomerPortalAppointments).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/portail/rdv/[id]', () => {
  it('cancels only the requested appointment using session identity', async () => {
    const response = await DELETE(
      new Request('https://example.test/api/portail/rdv/appointment-1', { method: 'DELETE' }),
      routeContext,
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, notificationSent: true })
    expect(cancelCustomerPortalAppointment).toHaveBeenCalledWith({
      appointmentId: 'appointment-1',
      organizationId: organizationA.id,
      verifiedEmail: 'synthetic-customer@example.test',
    })
    expect(sendAppointmentCancellationNotification).toHaveBeenCalledWith({
      cancellation,
      requestOrigin: 'https://example.test',
    })
  })

  it('does not send an email when the cancellation is rejected', async () => {
    vi.mocked(cancelCustomerPortalAppointment).mockRejectedValueOnce(
      new CustomerPortalHttpError(409, 'Cancellation refused'),
    )

    const response = await DELETE(
      new Request('https://example.test/api/portail/rdv/appointment-1', { method: 'DELETE' }),
      routeContext,
    )

    expect(response.status).toBe(409)
    expect(sendAppointmentCancellationNotification).not.toHaveBeenCalled()
  })

  it('rejects cross-origin requests before cancellation', async () => {
    const response = await DELETE(
      new Request('https://example.test/api/portail/rdv/appointment-1', {
        method: 'DELETE',
        headers: { origin: 'https://attacker.example' },
      }),
      routeContext,
    )

    expect(response.status).toBe(403)
    expect(cancelCustomerPortalAppointment).not.toHaveBeenCalled()
    expect(sendAppointmentCancellationNotification).not.toHaveBeenCalled()
  })

  it('requires a customer-only session', async () => {
    vi.mocked(getCustomerPortalSession).mockResolvedValueOnce(null)

    const response = await DELETE(
      new Request('https://example.test/api/portail/rdv/appointment-1', { method: 'DELETE' }),
      routeContext,
    )

    expect(response.status).toBe(401)
    expect(cancelCustomerPortalAppointment).not.toHaveBeenCalled()
  })
})
