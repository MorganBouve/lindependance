import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api'
import { getTestCampaignAdminAccess } from '@/lib/testCampaignAccess'
import {
  CreateOrganizationResponseSchema,
  CreateOrganizationSchema,
} from '@/schemas/techAdmin'
import { sendStaffActivationEmail } from '@/services/staffActivationEmail.service'
import { createOrganizationWithAdmin } from '@/services/organizationProvisioning.service'
import { listTechAdminOrganizations } from '@/services/techAdmin.service'

export async function GET() {
  try {
    const access = await getTestCampaignAdminAccess()
    if (!access.authorized) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs techniques.' }, { status: access.status })
    }
    return NextResponse.json(await listTechAdminOrganizations(), {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error: unknown) {
    return apiErrorResponse(error)
  }
}

export async function POST(request: Request) {
  let access: Awaited<ReturnType<typeof getTestCampaignAdminAccess>>
  try {
    access = await getTestCampaignAdminAccess()
  } catch (error: unknown) {
    return apiErrorResponse(error)
  }
  if (!access.authorized) {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs techniques.' }, { status: access.status })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 })
  }
  const parsed = CreateOrganizationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Les informations du salon sont invalides.' }, { status: 400 })
  }

  try {
    const created = await createOrganizationWithAdmin({
      actorId: access.session.user.id,
      name: parsed.data.name,
      slug: parsed.data.slug,
      firstAdminEmail: parsed.data.firstAdminEmail,
      portalContactEmail: parsed.data.portalContactEmail,
      portalContactPhone: parsed.data.portalContactPhone,
    })
    if (created.kind === 'actor_forbidden') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs techniques.' }, { status: 403 })
    }
    if (created.kind === 'slug_exists') {
      return NextResponse.json({ error: 'Ce slug est déjà utilisé.' }, { status: 409 })
    }
    if (created.kind === 'email_exists') {
      return NextResponse.json({ error: 'Cette adresse e-mail est déjà associée à un compte.' }, { status: 409 })
    }

    const invitation = await sendStaffActivationEmail({
      email: created.account.email,
      organizationName: created.organization.name,
    })
    const response = CreateOrganizationResponseSchema.safeParse({
      organization: created.organization,
      account: created.account,
      invitation,
    })
    if (!response.success) {
      throw new Error('La réponse de création du salon est invalide.')
    }

    return NextResponse.json(response.data, {
      status: 201,
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error: unknown) {
    return apiErrorResponse(error)
  }
}
