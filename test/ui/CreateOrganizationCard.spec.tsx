import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import CreateOrganizationCard from '@/components/test-admin/CreateOrganizationCard'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('CreateOrganizationCard', () => {
  it('requires the organization and ADMIN details plus explicit email authorization', () => {
    render(<CreateOrganizationCard />)

    expect(screen.getByLabelText('Nom du salon')).toBeRequired()
    expect(screen.getByLabelText('Slug du salon')).toBeRequired()
    expect(screen.getByLabelText('Adresse e-mail du premier ADMIN')).toBeRequired()
    expect(screen.getByRole('button', { name: 'Créer le salon et inviter le premier ADMIN' })).toBeDisabled()
    expect(screen.getByLabelText('E-mail de contact')).not.toBeRequired()
    expect(screen.getByLabelText('Téléphone de contact')).not.toBeRequired()
  })

  it('creates a real salon and displays invitation status without enabling its portal', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      organization: {
        id: 'org-new',
        name: 'Salon A',
        slug: 'salon-a',
        portalEnabled: false,
        portalContactEmail: null,
        portalContactPhone: null,
      },
      account: { id: 'admin-new', email: 'admin@example.test', role: 'ADMIN' },
      invitation: { sent: true, error: null },
    }), { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    render(<CreateOrganizationCard />)
    fireEvent.change(screen.getByLabelText('Nom du salon'), { target: { value: 'Salon A' } })
    fireEvent.change(screen.getByLabelText('Slug du salon'), { target: { value: 'salon-a' } })
    fireEvent.change(screen.getByLabelText('Adresse e-mail du premier ADMIN'), {
      target: { value: 'admin@example.test' },
    })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Créer le salon et inviter le premier ADMIN' }))

    expect(await screen.findByText('Le salon Salon A a été créé.')).toBeInTheDocument()
    expect(screen.getByText('Portail client désactivé jusqu’à sa configuration.')).toBeInTheDocument()
    expect(screen.getByText('Lien d’activation envoyé ; il expire dans une heure.')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/tech-admin/organizations', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        name: 'Salon A',
        slug: 'salon-a',
        firstAdminEmail: 'admin@example.test',
        portalContactEmail: '',
        portalContactPhone: '',
        confirmControlledEmail: true,
      }),
    }))
  })
})
