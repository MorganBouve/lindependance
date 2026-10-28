import { expect, test } from '@playwright/test'

test.describe('button press feedback', () => {
  test.use({ hasTouch: true })

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
