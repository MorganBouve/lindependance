import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import UnavailabilityModal from '@/components/calendar/UnavailabilityModal'

vi.mock('@/components/ui/BaseModal', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/ui/ConfirmDialog', () => ({
  default: ({
    isOpen,
    confirmLabel,
    onConfirm,
  }: {
    isOpen: boolean
    confirmLabel: string
    onConfirm: () => void
  }) => isOpen ? (
    <button type="button" onClick={onConfirm}>{confirmLabel}</button>
  ) : null,
}))

function UnavailabilityModalHarness({
  isOpen,
  initialStart,
}: {
  isOpen: boolean
  initialStart: Date
}) {
  if (!isOpen) return null
  return (
    <UnavailabilityModal
      isOpen
      initialStart={initialStart}
      initialEnd={new Date(initialStart.getTime() + 60 * 60 * 1000)}
      onClose={vi.fn()}
      onSuccess={vi.fn()}
    />
  )
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('UnavailabilityModal', () => {
  it('resets the form when a new modal session opens', () => {
    const { rerender } = render(
      <UnavailabilityModalHarness isOpen initialStart={new Date('2026-11-02T09:00:00')} />,
    )

    fireEvent.change(screen.getAllByDisplayValue('2026-11-02')[0], {
      target: { value: '2026-11-03' },
    })
    expect(screen.getByDisplayValue('2026-11-03')).toBeInTheDocument()

    rerender(<UnavailabilityModalHarness isOpen={false} initialStart={new Date('2026-11-02T09:00:00')} />)
    rerender(<UnavailabilityModalHarness isOpen initialStart={new Date('2026-11-04T11:00:00')} />)

    expect(screen.getAllByDisplayValue('2026-11-04')).toHaveLength(2)
  })

  it('shows progress while deleting an unavailability', async () => {
    let resolveDeletion: (value: Response) => void = () => {
      throw new Error('La suppression du créneau ne démarre pas')
    }
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => {
      resolveDeletion = resolve
    })))

    render(
      <UnavailabilityModal
        isOpen
        editingId="unavailability-1"
        initialStart={new Date('2026-11-02T09:00:00')}
        initialEnd={new Date('2026-11-02T10:00:00')}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer ce créneau' }))
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }))

    const pendingButton = screen.getByRole('button', { name: 'Suppression en cours…' })
    expect(pendingButton).toBeDisabled()
    expect(pendingButton).toHaveAttribute('aria-busy', 'true')

    await act(async () => {
      resolveDeletion(new Response(JSON.stringify({ count: 1 }), { status: 200 }))
    })
    expect(await screen.findByRole('button', { name: 'Supprimer ce créneau' })).toBeEnabled()
  })
})
