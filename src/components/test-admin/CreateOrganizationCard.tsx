'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { z } from 'zod'
import { CreateOrganizationResponseSchema } from '@/schemas/techAdmin'

type CreatedOrganization = z.infer<typeof CreateOrganizationResponseSchema>

async function readError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    const parsed = z.object({ error: z.string() }).safeParse(body)
    if (parsed.success) return parsed.data.error
  } catch {
    return `Erreur serveur (${response.status}).`
  }
  return `Erreur serveur (${response.status}).`
}

export default function CreateOrganizationCard() {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [createdOrganization, setCreatedOrganization] = useState<CreatedOrganization | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [firstAdminEmail, setFirstAdminEmail] = useState('')
  const [portalContactEmail, setPortalContactEmail] = useState('')
  const [portalContactPhone, setPortalContactPhone] = useState('')
  const [confirmControlledEmail, setConfirmControlledEmail] = useState(false)

  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreating(true)
    setError('')
    setCreatedOrganization(null)

    try {
      const response = await fetch('/api/tech-admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          firstAdminEmail,
          portalContactEmail,
          portalContactPhone,
          confirmControlledEmail,
        }),
      })
      if (!response.ok) throw new Error(await readError(response))

      const payload: unknown = await response.json()
      const parsed = CreateOrganizationResponseSchema.safeParse(payload)
      if (!parsed.success) throw new Error('La réponse de création du salon est invalide.')
      setCreatedOrganization(parsed.data)
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Impossible de créer le salon.')
    } finally {
      setCreating(false)
    }
  }

  function resetForm() {
    setError('')
    setCreatedOrganization(null)
    setName('')
    setSlug('')
    setFirstAdminEmail('')
    setPortalContactEmail('')
    setPortalContactPhone('')
    setConfirmControlledEmail(false)
  }

  return (
    <section className="mb-8 max-w-3xl rounded-3xl border border-studio-border bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-studio-text">Créer un salon réel</h2>
        <p className="mt-2 text-sm leading-6 text-studio-muted">
          Le salon et son premier compte ADMIN seront créés dans la base de cet environnement.
          Le portail client restera désactivé jusqu’à sa configuration.
        </p>
      </div>

      <form onSubmit={createOrganization} className="space-y-5">
        <div>
          <label htmlFor="organization-name" className="mb-2 block text-sm font-semibold text-studio-text">
            Nom du salon
          </label>
          <input
            id="organization-name"
            type="text"
            autoComplete="organization"
            required
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-studio-border px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label htmlFor="organization-slug" className="mb-2 block text-sm font-semibold text-studio-text">
            Slug du salon
          </label>
          <input
            id="organization-slug"
            type="text"
            autoComplete="off"
            required
            maxLength={63}
            pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="w-full rounded-xl border border-studio-border px-4 py-3 text-sm"
          />
          <p className="mt-2 text-xs text-studio-muted">
            Lettres, chiffres et tirets uniquement ; le slug sera enregistré en minuscules et doit être unique.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="organization-contact-email" className="mb-2 block text-sm font-semibold text-studio-text">
              E-mail de contact
            </label>
            <input
              id="organization-contact-email"
              type="email"
              autoComplete="email"
              value={portalContactEmail}
              onChange={(event) => setPortalContactEmail(event.target.value)}
              className="w-full rounded-xl border border-studio-border px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="organization-contact-phone" className="mb-2 block text-sm font-semibold text-studio-text">
              Téléphone de contact
            </label>
            <input
              id="organization-contact-phone"
              type="tel"
              autoComplete="tel"
              maxLength={40}
              value={portalContactPhone}
              onChange={(event) => setPortalContactPhone(event.target.value)}
              className="w-full rounded-xl border border-studio-border px-4 py-3 text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="organization-admin-email" className="mb-2 block text-sm font-semibold text-studio-text">
            Adresse e-mail du premier ADMIN
          </label>
          <input
            id="organization-admin-email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={firstAdminEmail}
            onChange={(event) => setFirstAdminEmail(event.target.value)}
            className="w-full rounded-xl border border-studio-border px-4 py-3 text-sm"
          />
        </div>

        <label className="flex items-start gap-3 text-sm leading-6 text-studio-muted">
          <input
            type="checkbox"
            required
            checked={confirmControlledEmail}
            onChange={(event) => setConfirmControlledEmail(event.target.checked)}
            className="mt-1"
          />
          <span>Je confirme que cette adresse est contrôlée par la personne invitée et j’autorise l’envoi du lien d’activation.</span>
        </label>

        <button
          type="submit"
          disabled={
            creating
            || createdOrganization !== null
            || !name.trim()
            || !slug.trim()
            || !firstAdminEmail.trim()
            || !confirmControlledEmail
          }
          className="rounded-2xl bg-studio-primary px-5 py-3 text-sm font-semibold text-studio-text transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? 'Création en cours…' : 'Créer le salon et inviter le premier ADMIN'}
        </button>
      </form>

      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}

      {createdOrganization && (
        <section role="status" className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="font-bold text-emerald-950">Le salon {createdOrganization.organization.name} a été créé.</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-semibold text-emerald-950">Slug</dt>
              <dd className="mt-1 break-all font-mono text-emerald-900">{createdOrganization.organization.slug}</dd>
            </div>
            <div>
              <dt className="font-semibold text-emerald-950">Premier ADMIN</dt>
              <dd className="mt-1 break-all text-emerald-900">{createdOrganization.account.email}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-emerald-900">Portail client désactivé jusqu’à sa configuration.</p>
          {createdOrganization.invitation.sent ? (
            <p className="mt-2 text-sm text-emerald-900">Lien d’activation envoyé ; il expire dans une heure.</p>
          ) : (
            <p role="alert" className="mt-2 text-sm text-red-800">
              {createdOrganization.invitation.error ?? 'Le salon et le compte sont créés, mais l’invitation n’a pas été envoyée.'}
            </p>
          )}
          <button
            type="button"
            onClick={resetForm}
            className="mt-5 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-studio-text ring-1 ring-studio-border hover:bg-studio-bg"
          >
            Créer un autre salon
          </button>
        </section>
      )}
    </section>
  )
}
