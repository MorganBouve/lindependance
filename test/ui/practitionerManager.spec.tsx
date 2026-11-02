import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import PractitionerManager from '@/components/settings/PractitionerManager'

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('PractitionerManager', () => {
  it('shows progress while reactivating a team member', async () => {
    let resolveReactivation: (value: Response) => void = () => {
      throw new Error('La réactivation ne démarre pas')
    }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response([{
        id: 'staff-1',
        firstName: 'Alex',
        lastName: 'Durand',
        active: false,
        title: 'Équipe',
      }]))
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveReactivation = resolve
      }))
    vi.stubGlobal('fetch', fetchMock)

    render(<PractitionerManager />)
    fireEvent.click(await screen.findByRole('button', { name: 'Réactiver' }))

    const pendingButton = screen.getByRole('button', { name: 'Réactivation en cours…' })
    expect(pendingButton).toBeDisabled()
    expect(pendingButton).toHaveAttribute('aria-busy', 'true')

    await act(async () => {
      resolveReactivation(response({ ok: true }))
    })
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Alex Durand peut de nouveau être choisi pour les rendez-vous.',
    )
  })
})
