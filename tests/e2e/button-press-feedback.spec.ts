import { expect, test } from '@playwright/test'

test.describe('button press feedback', () => {
  test.use({ hasTouch: true })

  test('submits the staff sign-in form when Enter is pressed in a credential field', async ({ page }) => {
    await page.route('**/api/auth/callback/credentials**', (route) => route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'CredentialsSignin' }),
    }))
    await page.goto('/auth/signin')

    const password = page.locator('input[type="password"]')
    await password.fill('password-example')
    const signInRequest = page.waitForRequest((request) => (
      request.method() === 'POST'
      && request.url().includes('/api/auth/callback/credentials')
    ))
    await password.press('Enter')

    expect(await signInRequest).toBeTruthy()
  })

  test('uses WCAG AA contrast for shared button color variants', async ({ page }) => {
    await page.goto('/auth/signin')

    const contrastRatios = await page.evaluate(() => {
      function luminance(color: string): number {
        const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number)
        if (!channels || channels.length !== 3) throw new Error(`Unexpected computed color: ${color}`)
        const linear = channels.map((channel) => {
          const value = channel / 255
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
      }

      const variants = [
        { className: 'text-white', background: 'var(--color-studio-action)' },
        { className: 'text-white', background: 'var(--color-studio-action-hover)' },
        { className: 'bg-rose-700 text-white', background: null },
        { className: 'bg-amber-700 text-white', background: null },
        { className: 'text-red-700', background: '#FEF2F2' },
        { className: 'text-rose-700', background: '#FFF1F2' },
        { className: 'text-gray-700', background: '#F3F4F6' },
        { className: 'text-slate-600', background: '#FFFFFF' },
        { className: 'text-gray-600', background: '#F9FAFB' },
        { className: 'text-studio-action', background: '#FFFFFF' },
      ]

      return variants.map(({ className, background }) => {
        const button = document.createElement('button')
        button.className = className
        if (background) button.style.backgroundColor = background
        document.body.append(button)
        const styles = getComputedStyle(button)
        const foreground = luminance(styles.color)
        const backdrop = luminance(styles.backgroundColor)
        button.remove()
        const [lighter, darker] = foreground >= backdrop
          ? [foreground, backdrop]
          : [backdrop, foreground]
        return (lighter + 0.05) / (darker + 0.05)
      })
    })

    for (const ratio of contrastRatios) {
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    }

    await expect(page.getByRole('button', { name: 'Se connecter' }))
      .toHaveCSS('border-top-style', 'solid')
  })

  test('shows a pressed state on mouse interaction', async ({ page }) => {
    await page.goto('/auth/signin')
    const button = page.getByRole('button', { name: /mot de passe/ })
    await expect(button).toBeVisible()

    const bounds = await button.boundingBox()
    if (!bounds) throw new Error('Password visibility button has no visible bounds')

    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
    await page.mouse.down()
    await expect(button).toHaveAttribute('data-pressed', 'true')
    await expect(button).toHaveCSS('filter', 'brightness(0.92)')
    await page.mouse.up()
    await expect(button).not.toHaveAttribute('data-pressed')
    await expect(button).toHaveCSS('filter', 'none')
  })

  test('shows visible keyboard focus and pressed feedback during activation', async ({ page }) => {
    await page.goto('/auth/signin')
    const button = page.getByRole('button', { name: /mot de passe/ })
    await expect(button).toBeVisible()

    for (let tabCount = 0; tabCount < 30; tabCount += 1) {
      if (await button.evaluate((element) => element === document.activeElement)) break
      await page.keyboard.press('Tab')
    }

    await expect(button).toBeFocused()
    await expect(button).toHaveCSS('outline-style', 'solid')
    await expect(button).toHaveCSS('outline-width', '2px')
    await page.keyboard.down('Space')
    await expect(button).toHaveCSS('filter', 'brightness(0.92)')
    await page.keyboard.up('Space')
    await expect(button).toHaveCSS('filter', 'none')
  })

  test('shows a pressed state during touch interaction', async ({ page }) => {
    await page.goto('/auth/signin')
    const button = page.getByRole('button', { name: /mot de passe/ })
    await expect(button).toBeVisible()

    const bounds = await button.boundingBox()
    if (!bounds) throw new Error('Password visibility button has no visible bounds')

    const touchSession = await page.context().newCDPSession(page)
    await touchSession.send('Emulation.setTouchEmulationEnabled', {
      enabled: true,
    })
    try {
      await touchSession.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{
          x: bounds.x + bounds.width / 2,
          y: bounds.y + bounds.height / 2,
          id: 1,
        }],
      })
      await expect(button).toHaveCSS('filter', 'brightness(0.92)')
    } finally {
      await touchSession.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      })
      await touchSession.detach()
    }
    await expect(button).toHaveCSS('filter', 'none')
  })

  test('keeps disabled and busy buttons out of the pressed state', async ({ page }) => {
    await page.goto('/auth/signin')
    const button = page.getByRole('button', { name: /mot de passe/ })
    await expect(button).toBeVisible()

    const bounds = await button.boundingBox()
    if (!bounds) throw new Error('Password visibility button has no visible bounds')

    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)

    for (const attribute of ['disabled', 'aria-disabled', 'aria-busy']) {
      await button.evaluate((element, name) => element.setAttribute(name, 'true'), attribute)
      await page.mouse.down()
      await expect(button).not.toHaveAttribute('data-pressed')
      await expect(button).toHaveCSS('filter', 'none')
      await page.mouse.up()
      await button.evaluate((element, name) => element.removeAttribute(name), attribute)
    }
  })
})
