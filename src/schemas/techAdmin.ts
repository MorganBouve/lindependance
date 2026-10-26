import { z } from 'zod'

export const TechAdminOrganizationsSchema = z.array(z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  hasAdmin: z.boolean().default(false),
}))

export const CreateInitialOrganizationAdminSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  confirmControlledEmail: z.literal(true),
}).strict()

const optionalContactEmailSchema = z.union([
  z.literal(''),
  z.string().trim().toLowerCase().email().max(254),
]).optional().transform((value) => value || undefined)

const optionalContactPhoneSchema = z.union([
  z.literal(''),
  z.string().trim().max(40),
]).optional().transform((value) => value || undefined)

export const CreateOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().toLowerCase().min(1).max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  firstAdminEmail: z.string().trim().toLowerCase().email().max(254),
  portalContactEmail: optionalContactEmailSchema,
  portalContactPhone: optionalContactPhoneSchema,
  confirmControlledEmail: z.literal(true),
}).strict()

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>

export const CreateOrganizationResponseSchema = z.object({
  organization: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    slug: z.string().min(1),
    portalEnabled: z.literal(false),
    portalContactEmail: z.string().email().nullable(),
    portalContactPhone: z.string().nullable(),
  }).strict(),
  account: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    role: z.literal('ADMIN'),
  }).strict(),
  invitation: z.object({
    sent: z.boolean(),
    error: z.string().nullable(),
  }).strict(),
}).strict()

export const InitialOrganizationAdminResponseSchema = z.object({
  organization: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  }).strict(),
  account: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    role: z.literal('ADMIN'),
  }).strict(),
  invitation: z.object({
    sent: z.boolean(),
    error: z.string().nullable(),
  }).strict(),
}).strict()

export const TechAdminPortalDomainConfigurationSchema = z.object({
  domains: z.array(z.object({
    id: z.string().min(1),
    hostname: z.string().min(1),
    organizationId: z.string().min(1),
    organizationName: z.string().min(1),
    organizationSlug: z.string().nullable(),
    portalAvailable: z.boolean(),
  }).strict()),
  organizations: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    slug: z.string().min(1),
  }).strict()),
}).strict()

export const CreateTechAdminPortalDomainSchema = z.object({
  hostname: z.string().trim().min(1).max(253),
  organizationId: z.string().trim().min(1).max(128),
}).strict()

export const TechAdminPortalDomainMutationResponseSchema = z.object({
  id: z.string().min(1),
  hostname: z.string().min(1),
}).strict()

export const TechAdminOrganizationFilterSchema = z.object({
  organizationIds: z.array(z.string().trim().min(1).max(128)),
}).strict()

export const CreateTestSalonSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
  confirmControlledEmail: z.literal(true),
}).strict()

export type CreateTestSalonInput = z.infer<typeof CreateTestSalonSchema>

export const TestSalonProvisionResponseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  customerEmail: z.string().email(),
  staffAccount: z.object({
    email: z.string().email(),
    role: z.enum(['USER', 'ADMIN']),
  }).strict(),
  invitation: z.object({
    sent: z.boolean(),
    error: z.string().nullable(),
  }).strict(),
}).strict()
