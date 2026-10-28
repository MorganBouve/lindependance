'use client'

import { useEffect } from 'react'

const PRESSABLE_BUTTON_SELECTOR = 'button:not(:disabled):not([aria-disabled="true"]):not([aria-busy="true"])'

export default function ButtonPressFeedback() {
  useEffect(() => {
    const pressedButtons = new Map<number, HTMLButtonElement>()

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !(event.target instanceof Element)) return

      const button = event.target.closest<HTMLButtonElement>(PRESSABLE_BUTTON_SELECTOR)
      if (!button) return

      pressedButtons.set(event.pointerId, button)
      button.dataset.pressed = 'true'
    }

    const releaseButton = (event: PointerEvent) => {
      const button = pressedButtons.get(event.pointerId)
      if (!button) return

      button.removeAttribute('data-pressed')
      pressedButtons.delete(event.pointerId)
    }

    const clearPressedButtons = () => {
      for (const button of pressedButtons.values()) {
        button.removeAttribute('data-pressed')
      }
      pressedButtons.clear()
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('pointerup', releaseButton, true)
    document.addEventListener('pointercancel', releaseButton, true)
    window.addEventListener('blur', clearPressedButtons)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('pointerup', releaseButton, true)
      document.removeEventListener('pointercancel', releaseButton, true)
      window.removeEventListener('blur', clearPressedButtons)
      clearPressedButtons()
    }
  }, [])

  return null
}
