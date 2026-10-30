import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { signIn } from 'next-auth/react'
import SignInPage from '@/app/auth/signin/page'

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('SignInPage', () => {
  it('submits the credentials form without submitting the password visibility control', async () => {
    vi.mocked(signIn).mockResolvedValue({
      error: 'CredentialsSignin',
      code: undefined,
      ok: false,
      status: 401,
      url: null,
    })

    render(<SignInPage />)

    const signInButton = screen.getByRole('button', { name: 'Se connecter' })
    expect(signInButton).toHaveAttribute('type', 'submit')
    expect(screen.getByRole('button', { name: 'Afficher le mot de passe' }))
      .toHaveAttribute('type', 'button')

    const form = signInButton.closest('form')
    if (!form) throw new Error('Staff sign-in form is missing')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        redirect: false,
        email: '',
        password: '',
      })
    })
  })
})
