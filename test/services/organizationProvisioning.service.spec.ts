import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@prisma/client'

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  organizationFindUnique: vi.fn(),
  organizationCreate: vi.fn(),
  userFindFirst: vi.fn(),
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { $transaction: mocks.transaction },
}))

import { createOrganizationWithAdmin } from '@/services/organizationProvisioning.service'

const transactionClient = {
  organization: {
    findUnique: mocks.organizationFindUnique,
    create: mocks.organizationCreate,
  },
  user: {
    findFirst: mocks.userFindFirst,
    findUnique: mocks.userFindUnique,
    create: mocks.userCreate,
  },
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.transaction.mockImplementation(async (callback) => callback(transactionClient))
  mocks.organizationFindUnique.mockResolvedValue(null)
  mocks.organizationCreate.mockResolvedValue({
    id: 'org-new',
    name: 'Salon A',
    slug: 'salon-a',
    portalEnabled: false,
    portalContactEmail: 'contact@example.test',
    portalContactPhone: '+33123456789',
  })
  mocks.userFindFirst.mockResolvedValue({ id: 'tech-admin' })
  mocks.userFindUnique.mockResolvedValue(null)
  mocks.userCreate.mockResolvedValue({
    id: 'admin-new',
    email: 'admin@example.test',
    role: 'ADMIN',
  })
})

describe('createOrganizationWithAdmin', () => {
  it('creates the real organization with a passwordless ADMIN in one transaction', async () => {
    const result = await createOrganizationWithAdmin({
      actorId: 'tech-admin',
      name: 'Salon A',
      slug: 'salon-a',
      firstAdminEmail: 'admin@example.test',
      portalContactEmail: 'contact@example.test',
      portalContactPhone: '+33123456789',
    })

    expect(result).toEqual({
      kind: 'created',
      organization: {
        id: 'org-new',
        name: 'Salon A',
        slug: 'salon-a',
        portalEnabled: false,
        portalContactEmail: 'contact@example.test',
        portalContactPhone: '+33123456789',
      },
      account: { id: 'admin-new', email: 'admin@example.test', role: 'ADMIN' },
    })
    expect(mocks.transaction).toHaveBeenCalledOnce()
    expect(mocks.userFindFirst).toHaveBeenCalledWith({
      where: { id: 'tech-admin', role: 'TECH_ADMIN' },
      select: { id: true },
    })
    expect(mocks.organizationCreate).toHaveBeenCalledWith({
      data: {
        name: 'Salon A',
        slug: 'salon-a',
        portalEnabled: false,
        portalContactEmail: 'contact@example.test',
        portalContactPhone: '+33123456789',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        portalEnabled: true,
        portalContactEmail: true,
        portalContactPhone: true,
      },
    })
    expect(mocks.userCreate).toHaveBeenCalledWith({
      data: {
        email: 'admin@example.test',
        role: 'ADMIN',
        organizationId: 'org-new',
        hashedPassword: null,
      },
      select: { id: true, email: true, role: true },
    })
  })

  it('does not create an organization when its slug is already in use', async () => {
    mocks.organizationFindUnique.mockResolvedValueOnce({ id: 'existing-org' })

    await expect(createOrganizationWithAdmin({
      actorId: 'tech-admin',
      name: 'Salon A',
      slug: 'salon-a',
      firstAdminEmail: 'admin@example.test',
    })).resolves.toEqual({ kind: 'slug_exists' })
    expect(mocks.organizationCreate).not.toHaveBeenCalled()
    expect(mocks.userCreate).not.toHaveBeenCalled()
  })

  it('does not create an organization when the ADMIN email is already in use', async () => {
    mocks.userFindUnique.mockResolvedValueOnce({ id: 'existing-user' })

    await expect(createOrganizationWithAdmin({
      actorId: 'tech-admin',
      name: 'Salon A',
      slug: 'salon-a',
      firstAdminEmail: 'admin@example.test',
    })).resolves.toEqual({ kind: 'email_exists' })
    expect(mocks.organizationCreate).not.toHaveBeenCalled()
    expect(mocks.userCreate).not.toHaveBeenCalled()
  })

  it('rejects a caller whose TECH_ADMIN role is no longer present', async () => {
    mocks.userFindFirst.mockResolvedValueOnce(null)

    await expect(createOrganizationWithAdmin({
      actorId: 'tech-admin',
      name: 'Salon A',
      slug: 'salon-a',
      firstAdminEmail: 'admin@example.test',
    })).resolves.toEqual({ kind: 'actor_forbidden' })
    expect(mocks.organizationCreate).not.toHaveBeenCalled()
  })

  it('stores null contact values when they are omitted', async () => {
    await createOrganizationWithAdmin({
      actorId: 'tech-admin',
      name: 'Salon A',
      slug: 'salon-a',
      firstAdminEmail: 'admin@example.test',
    })

    expect(mocks.organizationCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        portalContactEmail: null,
        portalContactPhone: null,
      }),
    }))
  })

  it('maps concurrent unique-constraint conflicts to the matching field', async () => {
    const slugConflict = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target: ['slug'] },
    })
    const emailConflict = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target: ['email'] },
    })

    mocks.transaction.mockRejectedValueOnce(slugConflict)
    await expect(createOrganizationWithAdmin({
      actorId: 'tech-admin',
      name: 'Salon A',
      slug: 'salon-a',
      firstAdminEmail: 'admin@example.test',
    })).resolves.toEqual({ kind: 'slug_exists' })

    mocks.transaction.mockRejectedValueOnce(emailConflict)
    await expect(createOrganizationWithAdmin({
      actorId: 'tech-admin',
      name: 'Salon A',
      slug: 'salon-a',
      firstAdminEmail: 'admin@example.test',
    })).resolves.toEqual({ kind: 'email_exists' })
  })
})
