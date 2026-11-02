import { cleanup, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { afterEach, describe, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import AppointmentModal from '@/components/calendar/AppointmentModal'

const appointmentFormState = vi.hoisted(() => ({ isSaving: false, isDeleting: false }))

vi.mock('@/actions/createCustomerAndReturn', () => ({
  createCustomerAndReturn: vi.fn(),
}))

vi.mock('@/hooks/useAppointmentForm', () => ({
  useAppointmentForm: () => ({
    selectedCustomer: null,
    setSelectedCustomer: vi.fn(),
    serviceId: '',
    note: '',
    setNote: vi.fn(),
    startTime: '09:00',
    duration: 30,
    date: '2026-10-13',
    setDate: vi.fn(),
    customerPackages: [],
    usePackage: false,
    setUsePackage: vi.fn(),
    selectedCustomerPackageId: null,
    setSelectedCustomerPackageId: vi.fn(),
    isSaving: appointmentFormState.isSaving,
    isDeleting: appointmentFormState.isDeleting,
    isNoteSaving: false,
    noteSavedAt: null,
    noteDirty: false,
    collision: false,
    setCollision: vi.fn(),
    confirmDeleteOpen: false,
    setConfirmDeleteOpen: vi.fn(),
    HORAIRE_OUVERTURE: '09:00',
    HORAIRE_FERMETURE: '18:00',
    isTimeOutOfBounds: false,
    isFormInvalid: true,
    getEndTimeLabel: () => '09:30',
    handleServiceChange: vi.fn(),
    handleSave: vi.fn(),
    handleDelete: vi.fn(),
    handleConfirmDelete: vi.fn(),
    handleSaveNote: vi.fn(),
    setStartTime: vi.fn(),
    setDuration: vi.fn(),
  }),
}))

vi.mock('@/components/ui/BaseModal', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/calendar/PackageSelector', () => ({
  PackageSelector: () => null,
}))

vi.mock('@/components/ui/ConfirmDialog', () => ({
  default: () => null,
}))

describe('AppointmentModal accessible field labels', () => {
  afterEach(() => {
    cleanup()
    appointmentFormState.isSaving = false
    appointmentFormState.isDeleting = false
  })

  it('associates the visible labels with all appointment controls', () => {
    render(
      <AppointmentModal
        isOpen
        onCloseAction={vi.fn()}
        onSuccess={vi.fn().mockResolvedValue(undefined)}
      />
    )

    expect(screen.getByRole('button', { name: 'Client' })).toBeInTheDocument()
    expect(screen.getByLabelText('Date')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('Début')).toHaveAttribute('type', 'time')
    expect(screen.getByLabelText('Durée (min)')).toHaveAttribute('type', 'number')
    expect(screen.getByLabelText('Service')).toBeInTheDocument()
    expect(screen.getByLabelText('Note')).toBeInTheDocument()
  })

  it('does not label appointment saving as a deletion', () => {
    appointmentFormState.isSaving = true
    render(
      <AppointmentModal
        isOpen
        initialData={{ id: 'appointment-1' }}
        onCloseAction={vi.fn()}
        onSuccess={vi.fn().mockResolvedValue(undefined)}
      />
    )

    const deleteButton = screen.getByRole('button', { name: 'SUPPRIMER' })
    expect(deleteButton).toBeDisabled()
    expect(deleteButton).toHaveAttribute('aria-busy', 'false')
  })

  it('shows progress while deleting an appointment', () => {
    appointmentFormState.isSaving = true
    appointmentFormState.isDeleting = true
    render(
      <AppointmentModal
        isOpen
        initialData={{ id: 'appointment-1' }}
        onCloseAction={vi.fn()}
        onSuccess={vi.fn().mockResolvedValue(undefined)}
      />
    )

    const deleteButton = screen.getByRole('button', { name: 'SUPPRESSION EN COURS…' })
    expect(deleteButton).toBeDisabled()
    expect(deleteButton).toHaveAttribute('aria-busy', 'true')
  })
})
