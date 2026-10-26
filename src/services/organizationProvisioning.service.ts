import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { CreateOrganizationInput } from '@/schemas/techAdmin'

type OrganizationSummary = {
  id: string
  name: string
  slug: string
  portalEnabled: false
  portalContactEmail: string | null
  portalContactPhone: string | null
}

type AdminSummary = {
  id: string
  email: string
  role: 'ADMIN'
}

export type CreateOrganizationWithAdminResult =
  | { kind: 'created'; organization: OrganizationSummary; account: AdminSummary }
  | { kind: 'slug_exists' }
  | { kind: 'email_exists' }
  | { kind: 'actor_forbidden' }

function uniqueConstraintTargets(error: Prisma.PrismaClientKnownRequestError): string[] {
  const target = error.meta?.target
  if (typeof target === 'string') return [target.toLowerCase()]
  if (Array.isArray(target)) {
    return target.filter((field): field is string => typeof field === 'string')
      .map((field) => field.toLowerCase())
  }
  return []
}

function uniqueConstraintResult(error: unknown): CreateOrganizationWithAdminResult | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return null
  }
  const targets = uniqueConstraintTargets(error)
  if (targets.some((target) => target.includes('slug'))) return { kind: 'slug_exists' }
  if (targets.some((target) => target.includes('email'))) return { kind: 'email_exists' }
  return null
}

export async function createOrganizationWithAdmin(input: {
  actorId: string
  name: CreateOrganizationInput['name']
  slug: CreateOrganizationInput['slug']
  firstAdminEmail: CreateOrganizationInput['firstAdminEmail']
  portalContactEmail?: CreateOrganizationInput['portalContactEmail']
  portalContactPhone?: CreateOrganizationInput['portalContactPhone']
}): Promise<CreateOrganizationWithAdminResult> {
  try {
    return await prisma.$transaction(async (transaction) => {
      const actor = await transaction.user.findFirst({
        where: { id: input.actorId, role: 'TECH_ADMIN' },
        select: { id: true },
      })
      if (!actor) return { kind: 'actor_forbidden' }

      const existingOrganization = await transaction.organization.findUnique({
        where: { slug: input.slug },
        select: { id: true },
      })
      if (existingOrganization) return { kind: 'slug_exists' }

      const existingAccount = await transaction.user.findUnique({
        where: { email: input.firstAdminEmail },
        select: { id: true },
      })
      if (existingAccount) return { kind: 'email_exists' }

      const organization = await transaction.organization.create({
        data: {
          name: input.name,
          slug: input.slug,
          portalEnabled: false,
          portalContactEmail: input.portalContactEmail ?? null,
          portalContactPhone: input.portalContactPhone ?? null,
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
      if (organization.slug === null) {
        throw new Error('Le slug du salon créé est manquant.')
      }
      const account = await transaction.user.create({
        data: {
          email: input.firstAdminEmail,
          role: 'ADMIN',
          organizationId: organization.id,
          hashedPassword: null,
        },
        select: { id: true, email: true, role: true },
      })

      return {
        kind: 'created',
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          portalEnabled: false,
          portalContactEmail: organization.portalContactEmail,
          portalContactPhone: organization.portalContactPhone,
        },
        account: {
          id: account.id,
          email: account.email ?? input.firstAdminEmail,
          role: 'ADMIN',
        },
      }
    })
  } catch (error: unknown) {
    const result = uniqueConstraintResult(error)
    if (result) return result
    throw error
  }
}
