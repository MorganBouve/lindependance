import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import TestCampaignDetail from '@/components/test-feedback/TestCampaignDetail'

function campaignDetails(status: 'ACTIVE' | 'CLOSED') {
  return {
    campaign: {
      id: 'campaign-1',
      name: 'Recette réservation',
      scenarioGroups: ['ONLINE_BOOKING'],
      profiles: ['USER'],
      status,
      publicToken: 'public-token',
      createdAt: '2026-10-04T09:00:00.000Z',
      closedAt: status === 'CLOSED' ? '2026-10-04T10:00:00.000Z' : null,
      organizationName: 'Osez le T’re',
    },
    progress: {
      total: 0,
      tested: 0,
      passed: 0,
      failed: 0,
      blocked: 0,
      remaining: 0,
      currentResults: [],
    },
    scenarios: [],
    history: [],
    campaignReviews: [],
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('TestCampaignDetail', () => {
  it('shows feedback with readable answers and reduced metadata', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      campaign: {
        id: 'campaign-1',
        name: 'Recette réservation',
        scenarioGroups: ['ONLINE_BOOKING'],
        profiles: ['USER'],
        status: 'ACTIVE',
        publicToken: 'public-token',
        createdAt: '2026-10-04T09:00:00.000Z',
        closedAt: null,
        organizationName: 'Osez le T’re',
      },
      progress: {
        total: 10,
        tested: 0,
        passed: 0,
        failed: 0,
        blocked: 0,
        remaining: 10,
        currentResults: [],
      },
      scenarios: [{
        id: 'CUS-01',
        profile: 'USER',
        title: 'Ouvrir la réservation',
        priority: 'P1',
        steps: 'Ouvrir le lien.',
        expected: 'Le formulaire apparaît.',
        result: {
          id: 'feedback-1',
          status: 'FAIL',
          comment: 'Le lien affiche une erreur.',
          environment: 'Safari sur iPhone',
          createdAt: '2026-10-04T09:30:00.000Z',
        },
      }],
      history: [{
        id: 'feedback-1',
        profile: 'USER',
        scenarioId: 'CUS-01',
        scenarioTitle: 'Ouvrir la réservation',
        scenarioPriority: 'P1',
        status: 'FAIL',
        environment: 'Safari sur iPhone',
        comment: 'Le lien affiche une erreur.',
        createdAt: '2026-10-04T09:30:00.000Z',
      }],
      campaignReviews: [{
        id: 'review-1',
        profile: 'USER',
        clarity: 'MOSTLY_CLEAR',
        duration: 'ABOUT_RIGHT',
        links: 'VERY_USEFUL',
        satisfaction: 'SATISFIED',
        comment: 'Les liens directs m’ont aidé.',
        createdAt: '2026-10-04T09:35:00.000Z',
      }],
    }), { status: 200 })))

    render(<TestCampaignDetail campaignId="campaign-1" />)

    expect(await screen.findByRole('heading', { name: 'Avis général des testeurs' })).toBeInTheDocument()
    expect(screen.getByDisplayValue(`${window.location.origin}/retour-test/public-token`))
      .toBeInTheDocument()
    expect(screen.getByText('Plutôt compréhensibles')).toBeInTheDocument()
    expect(screen.getByText('Adaptée')).toBeInTheDocument()
    expect(screen.getByText('Oui, très utiles')).toBeInTheDocument()
    expect(screen.getByText('Plutôt satisfaisante')).toBeInTheDocument()
    expect(screen.getByText('Les liens directs m’ont aidé.')).toBeInTheDocument()
    expect(screen.getByText(/Profil déclaré : Utilisateur · 4 oct\. 2026/)).toBeInTheDocument()
    expect(screen.getByText(/Utilisateur · P1 · 4 oct\. 2026/)).toBeInTheDocument()
    expect(screen.queryByText(/09:30|09:35|Safari sur iPhone/)).not.toBeInTheDocument()
    expect(screen.getByText(/le suivi affiche le profil déclaré et le jour de réception/i)).toBeInTheDocument()
  })

  it('downloads the current campaign feedback as a JSON file', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      campaign: {
        id: 'campaign-1',
        name: 'Recette réservation',
        scenarioGroups: ['ONLINE_BOOKING'],
        profiles: ['USER'],
        status: 'ACTIVE',
        publicToken: 'public-token',
        createdAt: '2026-10-04T09:00:00.000Z',
        closedAt: null,
        organizationName: 'Osez le T’re',
      },
      progress: {
        total: 0,
        tested: 0,
        passed: 0,
        failed: 0,
        blocked: 0,
        remaining: 0,
        currentResults: [],
      },
      scenarios: [],
      history: [],
      campaignReviews: [],
    }), { status: 200 })))
    const createObjectURL = vi.fn(() => 'blob:campaign-export')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const clickedLinks: HTMLAnchorElement[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function captureClick(this: HTMLAnchorElement) {
      clickedLinks.push(this)
    })

    render(<TestCampaignDetail campaignId="campaign-1" />)

    fireEvent.click(await screen.findByRole('button', { name: 'Télécharger les retours (JSON)' }))

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(clickedLinks).toHaveLength(1)
    expect(clickedLinks[0].download).toMatch(/^recette-reservation-\d{4}-\d{2}-\d{2}\.json$/)
    expect(clickedLinks[0].href).toBe('blob:campaign-export')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:campaign-export')
  })

  it('shows progress while closing a campaign', async () => {
    let resolveClose: (response: Response) => void = () => {
      throw new Error('La clôture de la campagne ne démarre pas')
    }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(campaignDetails('ACTIVE')), { status: 200 }))
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveClose = resolve
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify(campaignDetails('CLOSED')), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<TestCampaignDetail campaignId="campaign-1" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Clôturer la campagne' }))

    const pendingButton = screen.getByRole('button', { name: 'Clôture en cours…' })
    expect(pendingButton).toBeDisabled()
    expect(pendingButton).toHaveAttribute('aria-busy', 'true')

    await act(async () => {
      resolveClose(new Response(JSON.stringify({ status: 'CLOSED' }), { status: 200 }))
    })
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Clôturer la campagne' })).not.toBeInTheDocument()
    })
  })
})
