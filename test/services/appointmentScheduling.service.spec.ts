import { beforeEach, describe, expect, it, vi } from 'vitest'

const { transaction, prismaMock } = vi.hoisted(() => {
  const transaction = {
    service: { findFirst: vi.fn() },
    customer: { findFirst: vi.fn() },
    staff: { findFirst: vi.fn() },
    appointment: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    appointmentChangeRequest: { updateMany: vi.fn() },
    unavailability: { findMany: vi.fn() },
    customerPackage: { updateMany: vi.fn() },
  }
  return {
    transaction,
    prismaMock: {
      $transaction: vi.fn((operation: (tx: typeof transaction) => Promise<unknown>) => operation(transaction)),
    },
  }
})

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

import {
  createStaffAppointment,
  deleteStaffAppointment,
  updateStaffAppointment,
} from '@/services/appointmentScheduling.service'
import { CustomerPortalHttpError } from '@/services/customerPortal.service'

const startsAt = new Date('2026-10-01T10:00:00.000Z')
const endsAt = new Date('2026-10-01T11:00:00.000Z')

beforeEach(() => {
  vi.clearAllMocks()
  transaction.service.findFirst.mockResolvedValue({ id: 'service-1', price: 50 })
  transaction.customer.findFirst.mockResolvedValue({ id: 'customer-1' })
  transaction.staff.findFirst.mockResolvedValue({ id: 'staff-1' })
  transaction.appointment.findFirst.mockResolvedValue({
    id: 'appointment-1',
    staffId: 'staff-1',
  })
  transaction.appointment.findMany.mockResolvedValue([])
  transaction.unavailability.findMany.mockResolvedValue([])
  transaction.appointment.create.mockResolvedValue({ id: 'appointment-created' })
  transaction.appointment.updateMany.mockResolvedValue({ count: 1 })
  transaction.appointment.deleteMany.mockResolvedValue({ count: 1 })
  transaction.appointmentChangeRequest.updateMany.mockResolvedValue({ count: 1 })
  transaction.customerPackage.updateMany.mockResolvedValue({ count: 1 })
})

describe('staff appointment scheduling service', () => {
  it('checks organization-scoped conflicts and creates atomically with package usage', async () => {
    await createStaffAppointment({
      organizationId: 'org-1',
      start: startsAt,
      end: endsAt,
      duration: 60,
      serviceId: 'service-1',
      customerId: 'customer-1',
      staffId: 'staff-1',
      customerPackageId: 'package-1',
    })

    expect(prismaMock.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: 'Serializable' },
    )
    expect(transaction.appointment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        organizationId: 'org-1',
        OR: [{ staffId: 'staff-1' }, { staffId: null }],
        startTime: { lt: endsAt },
        endTime: { gt: startsAt },
      }),
    }))
    expect(transaction.appointment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        organizationId: 'org-1',
        bookingSource: 'STAFF',
        staffId: 'staff-1',
      }),
    }))
    expect(transaction.staff.findFirst).toHaveBeenCalledWith({
      where: { id: 'staff-1', organizationId: 'org-1', active: true },
      select: { id: true },
    })
    expect(transaction.customerPackage.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 'package-1',
        customer: { organizationId: 'org-1', id: 'customer-1' },
      }),
    }))
  })

  it('rejects a conflicting staff appointment before creating it', async () => {
    transaction.appointment.findMany.mockResolvedValueOnce([{
      startTime: startsAt,
      endTime: endsAt,
    }])

    await expect(createStaffAppointment({
      organizationId: 'org-1',
      start: startsAt,
      end: endsAt,
      duration: 60,
      serviceId: 'service-1',
      customerId: 'customer-1',
      staffId: 'staff-1',
    })).rejects.toMatchObject({ status: 409 })

    expect(transaction.appointment.create).not.toHaveBeenCalled()
  })

  it('rejects assigning an archived practitioner to a new appointment', async () => {
    transaction.staff.findFirst.mockResolvedValueOnce(null)

    await expect(createStaffAppointment({
      organizationId: 'org-1',
      start: startsAt,
      end: endsAt,
      duration: 60,
      serviceId: 'service-1',
      customerId: 'customer-1',
      staffId: 'staff-1',
    })).rejects.toMatchObject({ status: 404 })

    expect(transaction.appointment.create).not.toHaveBeenCalled()
  })

  it('checks conflicts for staff moves and returns the scoped updated appointment', async () => {
    const updated = { id: 'appointment-1', startTime: startsAt, endTime: endsAt }
    transaction.appointment.findFirst
      .mockResolvedValueOnce({ id: 'appointment-1', staffId: 'staff-1' })
      .mockResolvedValueOnce(updated)

    const result = await updateStaffAppointment({
      organizationId: 'org-1',
      id: 'appointment-1',
      start: startsAt,
      end: endsAt,
      duration: 60,
      staffId: 'staff-1',
    })

    expect(result).toEqual(updated)
    expect(transaction.appointment.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'appointment-1', organizationId: 'org-1' },
    }))
    expect(transaction.appointmentChangeRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        appointmentId: 'appointment-1',
        organizationId: 'org-1',
        status: 'PENDING',
      },
      data: expect.objectContaining({ status: 'REJECTED' }),
    }))
  })

  it('returns scoped cancellation details after deleting a future appointment', async () => {
    const futureStart = new Date('2026-11-01T10:00:00.000Z')
    const futureEnd = new Date('2026-11-01T11:00:00.000Z')
    const createdAt = new Date('2026-09-30T12:00:00.000Z')
    transaction.appointment.findFirst.mockResolvedValueOnce({
      id: 'appointment-1',
      status: 'CONFIRMED',
      finalPrice: null,
      startTime: futureStart,
      endTime: futureEnd,
      createdAt,
      calendarSequence: 2,
      customer: { email: 'client@example.test' },
      service: { name: 'Coupe' },
      organization: {
        id: 'org-1',
        name: 'Atelier',
        slug: 'atelier',
        timezone: 'Europe/Paris',
      },
    })

    const result = await deleteStaffAppointment({
      organizationId: 'org-1',
      id: 'appointment-1',
    })

    expect(result).toEqual({
      organizationId: 'org-1',
      recipientEmail: 'client@example.test',
      cancelledBy: 'SALON',
      cancelledAt: expect.any(Date),
      appointment: {
        id: 'appointment-1',
        startTime: futureStart,
        endTime: futureEnd,
        createdAt,
        calendarSequence: 2,
        serviceName: 'Coupe',
        organizationName: 'Atelier',
        timezone: 'Europe/Paris',
        organizationSlug: 'atelier',
      },
    })
    expect(transaction.appointment.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'appointment-1',
        organizationId: 'org-1',
        customer: { is: { organizationId: 'org-1' } },
        service: { is: { organizationId: 'org-1' } },
      },
      select: expect.objectContaining({
        customer: { select: { email: true } },
        organization: { select: { id: true, name: true, slug: true, timezone: true } },
      }),
    })
    expect(transaction.appointment.deleteMany).toHaveBeenCalledWith({
      where: { id: 'appointment-1', organizationId: 'org-1' },
    })
  })

  it('does not delete paid appointments or return cancellation details', async () => {
    transaction.appointment.findFirst.mockResolvedValueOnce({
      id: 'appointment-1',
      status: 'PAID',
      finalPrice: 50,
    })

    await expect(deleteStaffAppointment({
      organizationId: 'org-1',
      id: 'appointment-1',
    })).rejects.toMatchObject({ status: 403 })

    expect(transaction.appointment.deleteMany).not.toHaveBeenCalled()
  })

  it('returns 409 for an overlapping organization-wide unavailability', async () => {
    transaction.unavailability.findMany.mockResolvedValueOnce([{
      start: startsAt,
      end: endsAt,
    }])

    await expect(createStaffAppointment({
      organizationId: 'org-1',
      start: startsAt,
      end: endsAt,
      duration: 60,
      serviceId: 'service-1',
      customerId: 'customer-1',
      staffId: 'staff-1',
    })).rejects.toBeInstanceOf(CustomerPortalHttpError)

    expect(transaction.appointment.create).not.toHaveBeenCalled()
  })
})
