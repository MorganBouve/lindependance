import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ServiceManager from '@/components/settings/ServiceManager'

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

describe('ServiceManager', () => {
  it('shows progress while deleting a service and prevents duplicate deletion', async () => {
    let resolveDeletion: (value: Response) => void = () => {
      throw new Error('La suppression du service ne démarre pas')
    }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response([{
        id: 'service-1',
        name: 'Coupe',
        durationMinutes: 30,
        price: 45,
        color: '#C5908E',
      }]))
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveDeletion = resolve
      }))
      .mockResolvedValueOnce(response([]))
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<ServiceManager />)
    expect(await screen.findByText('Coupe')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer Coupe' }))

    const pendingButton = screen.getByRole('button', { name: 'Suppression de Coupe en cours' })
    expect(pendingButton).toBeDisabled()
    expect(pendingButton).toHaveAttribute('aria-busy', 'true')

    await act(async () => {
      resolveDeletion(response({ ok: true }))
    })
    await waitFor(() => {
      expect(screen.queryByText('Coupe')).not.toBeInTheDocument()
    })
  })
})
