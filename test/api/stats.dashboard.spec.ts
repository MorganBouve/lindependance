import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'
import { GET } from '../../src/app/api/stats/dashboard/route'

// Mock prisma groupBy and counts used by the service
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    appointment: { findMany: vi.fn() },
    customer: { count: vi.fn() },
    staff: { count: vi.fn() },
  },
}))

// Mock auth to control session
vi.mock('../../src/auth', () => ({
  auth: vi.fn(),
}))

import { prisma } from '../../src/lib/prisma'
import { auth } from '../../src/auth'

// RAISON: vi.mock replaces these typed exports with runtime Vitest mocks.
const authMock = auth as ReturnType<typeof vi.fn>
const appointmentFindManyMock = prisma.appointment.findMany as ReturnType<typeof vi.fn>
const customerCountMock = prisma.customer.count as ReturnType<typeof vi.fn>
const staffCountMock = prisma.staff.count as ReturnType<typeof vi.fn>
const dashboardResponseSchema = z.object({
  summary: z.object({
    totalRevenue: z.union([z.number(), z.string()]),
    appointmentCount: z.number(),
  }),
  timeseries: z.array(z.object({
    date: z.string(),
    revenue: z.union([z.number(), z.string()]),
  })),
})

beforeEach(() => {
  vi.resetAllMocks()
})

describe('/api/stats/dashboard', () => {
  it('returns correct totals when groupBy yields Decimal-like strings', async () => {
    authMock.mockResolvedValueOnce({ user: { organizationId: 'org-1' } })
    // The service uses findMany to fetch appointments for the period; mock that
    appointmentFindManyMock.mockResolvedValueOnce([
      { startTime: new Date('2026-03-30T10:00:00Z'), service: { price: 50.5 }, status: 'CONFIRMED', finalPrice: null },
      { startTime: new Date('2026-03-31T12:00:00Z'), service: { price: 100.25 }, status: 'CONFIRMED', finalPrice: null },
      { startTime: new Date('2026-03-31T15:00:00Z'), service: { price: null }, status: 'CONFIRMED', finalPrice: null },
    ])
    customerCountMock.mockResolvedValueOnce(3)
    staffCountMock.mockResolvedValueOnce(2)

    const req = new Request('http://localhost/api/stats/dashboard?start=2026-03-30&end=2026-03-31')
    const res = await GET(req)
    const body = dashboardResponseSchema.parse(await res.json())

    expect(Number(body.summary.totalRevenue)).toBeCloseTo(150.75)
    expect(body.summary.appointmentCount).toBe(3)
    expect(Array.isArray(body.timeseries)).toBe(true)
    const day30 = body.timeseries.find(({ date }) => date === '2026-03-30')
    expect(day30).toBeDefined()
    expect(Number(day30?.revenue)).toBeCloseTo(50.5)
  })

  it('enforces organization isolation', async () => {
    // auth returns org-A; groupBy mock should receive where.organizationId === 'org-A'
    appointmentFindManyMock.mockImplementationOnce((options: { where?: { organizationId?: string } }) => {
      if (options.where?.organizationId !== 'org-A') throw new Error('organization leak')
      return []
    })
    authMock.mockResolvedValueOnce({ user: { organizationId: 'org-A' } })
    customerCountMock.mockResolvedValueOnce(0)
    staffCountMock.mockResolvedValueOnce(0)

    const req = new Request('http://localhost/api/stats/dashboard')
    const res = await GET(req)
    const body = dashboardResponseSchema.parse(await res.json())
    expect(body).toBeDefined()
  })

  it('retourne 401 si non authentifié', async () => {
    authMock.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/stats/dashboard')
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('retourne 403 si session sans organizationId', async () => {
    authMock.mockResolvedValueOnce({ user: {} })

    const req = new Request('http://localhost/api/stats/dashboard')
    const res = await GET(req)

    expect(res.status).toBe(403)
  })

  it('retourne 400 si les paramètres de date sont invalides — L26', async () => {
    authMock.mockResolvedValueOnce({ user: { organizationId: 'org-1' } })

    const req = new Request('http://localhost/api/stats/dashboard?start=NOT_A_DATE&end=ALSO_INVALID')
    const res = await GET(req)

    expect(res.status).toBe(400)
    const body = z.object({ error: z.string() }).parse(await res.json())
    expect(body.error).toMatch(/invalid date/i)
  })

  it('retourne 500 si le service lance une exception — L35', async () => {
    authMock.mockResolvedValueOnce({ user: { organizationId: 'org-1' } })
    appointmentFindManyMock.mockRejectedValueOnce(new Error('DB connection lost'))

    const req = new Request('http://localhost/api/stats/dashboard')
    const res = await GET(req)

    expect(res.status).toBe(500)
    const body = z.object({ error: z.string() }).parse(await res.json())
    expect(body.error).toBe('Internal server error')
  })
})
