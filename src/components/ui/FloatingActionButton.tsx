"use client"

import React, { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

// Note: name the prop ending with "Action" to signal server-action compatibility
const subscribeToPortalRoot = () => () => {}
const getPortalRoot = () => document.body
const getServerPortalRoot = () => null

export default function FloatingActionButton({ onClickAction, ariaLabel = 'Nouveau' }: { onClickAction?: () => void; ariaLabel?: string }) {
  const portalRoot = useSyncExternalStore(
    subscribeToPortalRoot,
    getPortalRoot,
    getServerPortalRoot,
  )

  if (!portalRoot) return null

  const button = (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      data-testid="floating-quick-rdv"
      onClick={onClickAction}
      className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-studio-action text-white shadow-lg flex items-center justify-center hover:bg-studio-action-hover hover:scale-105 transition-transform"
      // inline styles to ensure visibility above any stacking context and enable pointer events
      style={{
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        zIndex: 2147483647,
        transform: 'none',
        pointerEvents: 'auto',
        // Fallback explicite : garantit la couleur même si la classe Tailwind
        // n'est pas générée par Tailwind v4 (variable CSS absente du @theme)
        backgroundColor: 'var(--color-studio-action, #74403D)',
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )

  return createPortal(button, portalRoot)
}
