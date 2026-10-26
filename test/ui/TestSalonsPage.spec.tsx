import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TestSalonsPage from '@/app/test-salons/page'

const mocks = vi.hoisted(() => ({
  getAccess: vi.fn(),
}))

vi.mock('@/lib/testCampaignAccess', () => ({
  getTestCampaignAdminAccess: mocks.getAccess,
}))
vi.mock('@/components/test-admin/InitialOrganizationAdminCard', () => ({
  default: () => <div data-testid="initial-admin-card" />,
}))
vi.mock('@/components/test-admin/TestSalonProvisioningCard', () => ({
  default: () => <div data-testid="synthetic-provisioning-card" />,
}))
vi.mock('@/components/test-admin/CreateOrganizationCard', () => ({
  default: () => <div data-testid="real-organization-card" />,
}))

import { getTestCampaignAdminAccess } from '@/lib/testCampaignAccess'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('TestSalonsPage', () => {
  it('shows real organization creation to TECH_ADMIN in production, without test-only tools', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('VERCEL_GIT_COMMIT_REF', 'main')
    vi.mocked(getTestCampaignAdminAccess).mockResolvedValue({
      authorized: true,
      session: {
        expires: '2026-10-23T12:00:00.000Z',
        user: {
          id: 'technical-admin',
          name: 'Technical Admin',
          email: 'admin@example.test',
          image: null,
          role: 'TECH_ADMIN',
          accountType: 'STAFF',
        },
      },
    })

    render(await TestSalonsPage())

    expect(screen.getByRole('heading', { name: 'Gestion des salons' })).toBeInTheDocument()
    expect(screen.getByTestId('real-organization-card')).toBeInTheDocument()
    expect(screen.queryByTestId('initial-admin-card')).not.toBeInTheDocument()
    expect(screen.queryByTestId('synthetic-provisioning-card')).not.toBeInTheDocument()
  })

  it('does not show organization creation to non-TECH_ADMIN accounts in production', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('VERCEL_GIT_COMMIT_REF', 'main')
    vi.mocked(getTestCampaignAdminAccess).mockResolvedValue({
      authorized: false,
      status: 403,
    })

    render(await TestSalonsPage())

    expect(screen.getByRole('alert')).toHaveTextContent('Accès réservé aux administrateurs techniques.')
    expect(screen.queryByTestId('real-organization-card')).not.toBeInTheDocument()
  })

  it('keeps test-only tools on the preprod preview and uses the studio color utilities', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('VERCEL_GIT_COMMIT_REF', 'preprod')
    vi.mocked(getTestCampaignAdminAccess).mockResolvedValue({
      authorized: true,
      session: {
        expires: '2026-10-23T12:00:00.000Z',
        user: {
          id: 'technical-admin',
          name: 'Technical Admin',
          email: 'admin@example.test',
          image: null,
          role: 'TECH_ADMIN',
          accountType: 'STAFF',
        },
      },
    })

    render(await TestSalonsPage())

    expect(screen.getByRole('main')).toHaveClass('bg-studio-bg')
    expect(screen.getByText('Administration technique')).toHaveClass('text-studio-primary')
    expect(screen.getByRole('heading', { name: 'Gestion des salons' })).toHaveClass('text-studio-text')
    expect(screen.getByText(/Créez un salon réel ou préparez un environnement fictif/)).toHaveClass('text-studio-muted')
    expect(screen.getByTestId('real-organization-card')).toBeInTheDocument()
    expect(screen.getByTestId('initial-admin-card')).toBeInTheDocument()
    expect(screen.getByTestId('synthetic-provisioning-card')).toBeInTheDocument()
  })
})
