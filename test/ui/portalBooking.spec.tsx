import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import PortalBooking from '@/components/customer-portal/PortalBooking'
import { DEFAULT_ORGANIZATION_BRANDING } from '@/domain/branding/logoSettings'
import { getPortalBookingWindow } from '@/domain/customer-portal/scheduling'

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const url = String(input)
    if (url.endsWith('/services')) return Promise.resolve(response([]))
    if (url.endsWith('/praticiens')) return Promise.resolve(response([]))
    if (url.endsWith('/customers')) return Promise.resolve(response({ error: 'Unauthorized' }, 401))
    return Promise.resolve(response({ timezone: 'Europe/Paris', slots: [] }))
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PortalBooking', () => {
  it('shows the organization name and logo without linking to the public agenda', async () => {
    render(
      <PortalBooking
        organizationSlug="osezletre"
        organizationTimezone="Europe/Paris"
        organizationName="Salon Élise"
        branding={{
          ...DEFAULT_ORGANIZATION_BRANDING,
          logoDataUrl: 'data:image/png;base64,aGVsbG8=',
        }}
        portalContactPhone="01 23 45 67 89"
        portalContactEmail="contact@salon-elise.fr"
      />,
    )

    expect(await screen.findByText('Salon Élise')).toBeInTheDocument()
    expect(screen.getByLabelText('Date')).toHaveAttribute(
      'max',
      getPortalBookingWindow(new Date(), 'Europe/Paris').maxDate,
    )
    expect(screen.getByRole('img', { name: 'Logo de Salon Élise' })).toHaveClass('rounded-full')
    expect(screen.getByTestId('portal-brand-preview')).toHaveAttribute('data-logo-size', '48')
    expect(screen.queryByRole('link', { name: 'Voir l’agenda public' })).not.toBeInTheDocument()
    expect(await screen.findByRole('link', { name: '01 23 45 67 89' })).toHaveAttribute('href', 'tel:0123456789')
    expect(screen.getByRole('link', { name: 'contact@salon-elise.fr' })).toHaveAttribute('href', 'mailto:contact@salon-elise.fr')
  })

  it('offers a subtle link to the staff sign-in page', async () => {
    render(
      <PortalBooking
        organizationSlug="osezletre"
        organizationTimezone="Europe/Paris"
        organizationName="Salon Élise"
        branding={DEFAULT_ORGANIZATION_BRANDING}
        portalContactPhone={null}
        portalContactEmail="contact@salon-elise.fr"
      />,
    )

    expect(await screen.findByText('Salon Élise')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Accès équipe' })).toHaveAttribute('href', '/auth/signin')
    expect(screen.getByText('Pour un premier rendez-vous, contactez le salon avant de réserver.')).toBeInTheDocument()
  })

  it('restores the verified customer session after a successful code check', async () => {
    let customerFetchCount = 0
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/services')) return Promise.resolve(response([]))
      if (url.endsWith('/praticiens')) return Promise.resolve(response([]))
      if (url.endsWith('/customers')) {
        customerFetchCount += 1
        return Promise.resolve(customerFetchCount === 1
          ? response({ error: 'Unauthorized' }, 401)
          : response([{ id: 'customer-1', firstName: 'Client', lastName: 'Recette' }]))
      }
      return Promise.resolve(response({ timezone: 'Europe/Paris', slots: [] }))
    })

    render(
      <PortalBooking
        organizationSlug="osezletre"
        organizationTimezone="Europe/Paris"
        organizationName="Salon Élise"
        branding={DEFAULT_ORGANIZATION_BRANDING}
        portalContactPhone="01 23 45 67 89"
        portalContactEmail={null}
      />,
    )

    const emailInput = await screen.findByLabelText('Email enregistré sur votre fiche client')
    fireEvent.change(emailInput, { target: { value: 'client@example.test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Recevoir un code' }))
    expect(await screen.findByText(/Si cet email correspond à une fiche client/)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Code de vérification'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier le code' }))

    expect(await screen.findByText('Adresse email vérifiée')).toBeInTheDocument()
    expect(screen.queryByLabelText('Email enregistré sur votre fiche client')).not.toBeInTheDocument()
    expect(screen.queryByText(/premier rendez-vous/)).not.toBeInTheDocument()
  })

  it('tells first-time visitors to call the salon when a phone number is available', async () => {
    render(
      <PortalBooking
        organizationSlug="osezletre"
        organizationTimezone="Europe/Paris"
        organizationName="Salon Élise"
        branding={DEFAULT_ORGANIZATION_BRANDING}
        portalContactPhone="01 23 45 67 89"
        portalContactEmail={null}
      />,
    )

    expect(await screen.findByText('Salon Élise')).toBeInTheDocument()
    const firstAppointmentMessage = screen.getByText('Pour un premier rendez-vous, appelez le salon.')
    const emailInput = screen.getByLabelText('Email enregistré sur votre fiche client')
    expect(
      firstAppointmentMessage.compareDocumentPosition(emailInput) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(screen.getByRole('link', { name: '01 23 45 67 89' })).toHaveAttribute('href', 'tel:0123456789')
  })

  it('shows neutral help about contacting the salon without checking the submitted email', async () => {
    render(
      <PortalBooking
        organizationSlug="osezletre"
        organizationTimezone="Europe/Paris"
        organizationName="Salon Élise"
        branding={DEFAULT_ORGANIZATION_BRANDING}
        portalContactPhone="01 23 45 67 89"
        portalContactEmail={null}
      />,
    )

    expect(await screen.findByText(/vous ne recevez pas de code/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '01 23 45 67 89' })).toHaveAttribute('href', 'tel:0123456789')
    expect(screen.queryByText(/aucune fiche client ne correspond/i)).not.toBeInTheDocument()
  })
})
