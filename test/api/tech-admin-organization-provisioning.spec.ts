import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getAccess: vi.fn(),
  createOrganization: vi.fn(),
  sendActivationEmail: vi.fn(),
}))

vi.mock('@/lib/testCampaignAccess', () => ({
  getTestCampaignAdminAccess: mocks.getAccess,
}))
vi.mock('@/services/organizationProvisioning.service', () => ({
  createOrganizationWithAdmin: mocks.createOrganization,
}))
vi.mock('@/services/staffActivationEmail.service', () => ({
  sendStaffActivationEmail: mocks.sendActivationEmail,
}))

import { POST } from '@/app/api/tech-admin/organizations/route'
import { getTestCampaignAdminAccess } from '@/lib/testCampaignAccess'
import { createOrganizationWithAdmin } from '@/services/organizationProvisioning.service'

function post(body: unknown) {
  return new Request('https://example.test/api/tech-admin/organizations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validInput = {
  name: 'Salon A',
  slug: 'Salon-A',
  firstAdminEmail: 'Admin@Example.Test',
  portalContactEmail: 'contact@example.test',
  portalContactPhone: '+33 1 23 45 67 89',
  confirmControlledEmail: true,
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('VERCEL_ENV', 'production')
  vi.stubEnv('VERCEL_GIT_COMMIT_REF', 'main')
  vi.mocked(getTestCampaignAdminAccess).mockResolvedValue({
    authorized: true,
    session: {
      expires: '2026-10-23T12:00:00.000Z',
      user: {
        id: 'technical-admin',
        name: 'Technical Admin',
        email: 'tech@example.test',
        image: null,
        role: 'TECH_ADMIN',
        accountType: 'STAFF',
      },
    },
  })
  vi.mocked(createOrganizationWithAdmin).mockResolvedValue({
    kind: 'created',
    organization: {
      id: 'org-new',
      name: 'Salon A',
      slug: 'salon-a',
      portalEnabled: false,
      portalContactEmail: 'contact@example.test',
      portalContactPhone: '+33 1 23 45 67 89',
    },
    account: { id: 'admin-new', email: 'admin@example.test', role: 'ADMIN' },
  })
  vi.mocked(mocks.sendActivationEmail).mockResolvedValue({ sent: true, error: null })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('POST /api/tech-admin/organizations', () => {
  it('creates an organization in production for an authorized TECH_ADMIN and sends activation', async () => {
    const response = await POST(post(validInput))

    expect(response.status).toBe(201)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    const body = await response.json()
    expect(body).toEqual({
      organization: {
        id: 'org-new',
        name: 'Salon A',
        slug: 'salon-a',
        portalEnabled: false,
        portalContactEmail: 'contact@example.test',
        portalContactPhone: '+33 1 23 45 67 89',
      },
      account: { id: 'admin-new', email: 'admin@example.test', role: 'ADMIN' },
      invitation: { sent: true, error: null },
    })
    expect(JSON.stringify(body)).not.toMatch(/password|token/i)
    expect(createOrganizationWithAdmin).toHaveBeenCalledWith({
      actorId: 'technical-admin',
      name: 'Salon A',
      slug: 'salon-a',
      firstAdminEmail: 'admin@example.test',
      portalContactEmail: 'contact@example.test',
      portalContactPhone: '+33 1 23 45 67 89',
    })
    expect(mocks.sendActivationEmail).toHaveBeenCalledWith({
      email: 'admin@example.test',
      organizationName: 'Salon A',
    })
  })

  it('requires TECH_ADMIN authorization and rejects unexpected organization or role fields', async () => {
    vi.mocked(getTestCampaignAdminAccess).mockResolvedValueOnce({
      authorized: false,
      status: 403,
    })
    expect((await POST(post(validInput))).status).toBe(403)
    vi.mocked(getTestCampaignAdminAccess).mockResolvedValueOnce({
      authorized: false,
      status: 401,
    })
    expect((await POST(post(validInput))).status).toBe(401)

    for (const extra of [
      { organizationId: 'org-2' },
      { role: 'TECH_ADMIN' },
    ]) {
      expect((await POST(post({ ...validInput, ...extra }))).status).toBe(400)
    }
    expect(createOrganizationWithAdmin).not.toHaveBeenCalled()
    expect(mocks.sendActivationEmail).not.toHaveBeenCalled()
  })

  it('rejects malformed JSON before calling the creation service', async () => {
    const response = await POST(new Request('https://example.test/api/tech-admin/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    }))

    expect(response.status).toBe(400)
    expect(createOrganizationWithAdmin).not.toHaveBeenCalled()
  })

  it('rejects missing required fields, malformed slugs, and unconfirmed email control', async () => {
    for (const invalid of [
      { ...validInput, name: '   ' },
      { ...validInput, slug: 'not a slug' },
      { ...validInput, firstAdminEmail: 'not-an-email' },
      { ...validInput, confirmControlledEmail: false },
      { name: 'Salon A', slug: 'salon-a', firstAdminEmail: 'admin@example.test' },
    ]) {
      expect((await POST(post(invalid))).status).toBe(400)
    }
    expect(createOrganizationWithAdmin).not.toHaveBeenCalled()
  })

  it('normalizes the slug and contact fields before persistence', async () => {
    await POST(post({
      ...validInput,
      slug: ' Salon-A ',
      portalContactEmail: '',
      portalContactPhone: '',
    }))

    expect(createOrganizationWithAdmin).toHaveBeenCalledWith(expect.objectContaining({
      slug: 'salon-a',
      portalContactEmail: undefined,
      portalContactPhone: undefined,
    }))
  })

  it('reports slug and email conflicts without sending activation', async () => {
    vi.mocked(createOrganizationWithAdmin).mockResolvedValueOnce({ kind: 'slug_exists' })
    expect((await POST(post(validInput))).status).toBe(409)
    vi.mocked(createOrganizationWithAdmin).mockResolvedValueOnce({ kind: 'email_exists' })
    expect((await POST(post(validInput))).status).toBe(409)
    expect(mocks.sendActivationEmail).not.toHaveBeenCalled()
  })

  it('reports activation failure while keeping the created salon and account', async () => {
    vi.mocked(mocks.sendActivationEmail).mockResolvedValueOnce({
      sent: false,
      error: 'Activation email was not sent.',
    })

    const response = await POST(post(validInput))

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({
      organization: { id: 'org-new' },
      account: { id: 'admin-new' },
      invitation: { sent: false, error: 'Activation email was not sent.' },
    })
  })
})
