'use client'

/**
 * CustomCursor
 *
 * Replaces the default OS cursor with:
 *  • A small red dot  (8 px)  — snaps to the real pointer position instantly.
 *  • A thin red ring  (28 px) — follows with a lerp lag for a liquid feel.
 *
 * Behaviour:
 *  • Grows + brightens on hover over interactive elements
 *    (a, button, [role="button"], [data-cursor="pointer"])
 *  • Hides when the real pointer leaves the window.
 *  • Adds `cursor-none` to <html> so the browser cursor is invisible.
 *
 * Usage: mount once at page level  →  <CustomCursor />
 */

import { useEffect, useRef } from 'react'

// Selector matching all interactive targets.
const HOVER_TARGET = 'a, button, [role="button"], [data-cursor="pointer"], label, input[type="checkbox"], input[type="radio"]'

export function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    // Hide default cursor globally
    document.documentElement.classList.add('cursor-none')

    // Current real pointer position (updated synchronously on mousemove)
    let px = window.innerWidth  / 2
    let py = window.innerHeight / 2

    // Ring's smoothed position
    let rx = px
    let ry = py

    let hovering  = false
    let visible   = false
    let rafId     = 0

    // ── RAF animation loop ────────────────────────────────────────────────
    function tick() {
      // Lerp ring toward real pointer
      rx += (px - rx) * 0.14
      ry += (py - ry) * 0.14

      // Dot: instant
      dot!.style.transform  = `translate(${px - 4}px, ${py - 4}px)`
      // Ring: lagging
      ring!.style.transform = `translate(${rx - 14}px, ${ry - 14}px) scale(${hovering ? 1.7 : 1})`

      rafId = requestAnimationFrame(tick)
    }

    // ── Event handlers ────────────────────────────────────────────────────
    function onMove(e: MouseEvent) {
      px = e.clientX
      py = e.clientY

      if (!visible) {
        dot!.style.opacity  = '1'
        ring!.style.opacity = '1'
        visible = true
      }

      // Detect hover
      const target = e.target as Element | null
      hovering = !!target?.closest(HOVER_TARGET)

      // Ring colour & thickness on hover
      if (hovering) {
        ring!.style.borderColor  = 'rgba(220, 38, 38, 0.9)'  // red-600
        ring!.style.width        = '28px'
        ring!.style.height       = '28px'
      } else {
        ring!.style.borderColor  = 'rgba(239, 68, 68, 0.55)' // red-500 dim
        ring!.style.width        = '28px'
        ring!.style.height       = '28px'
      }
    }

    function onLeave() {
      dot!.style.opacity  = '0'
      ring!.style.opacity = '0'
      visible = false
    }

    function onEnter() {
      dot!.style.opacity  = '1'
      ring!.style.opacity = '1'
      visible = true
    }

    document.addEventListener('mousemove',  onMove)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('mousemove',  onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      document.documentElement.classList.remove('cursor-none')
    }
  }, [])

  return (
    <>
      {/* ── Dot ──────────────────────────────────────────────────────── */}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position:         'fixed',
          top:              0,
          left:             0,
          width:            '8px',
          height:           '8px',
          borderRadius:     '50%',
          background:       '#ef4444',   // red-500
          pointerEvents:    'none',
          zIndex:           99999,
          opacity:          0,
          boxShadow:        '0 0 6px 2px rgba(239,68,68,0.6)',
          transition:       'opacity 0.15s ease',
          willChange:       'transform',
        }}
      />

      {/* ── Ring ─────────────────────────────────────────────────────── */}
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position:         'fixed',
          top:              0,
          left:             0,
          width:            '28px',
          height:           '28px',
          borderRadius:     '50%',
          border:           '1.5px solid rgba(239,68,68,0.55)',
          pointerEvents:    'none',
          zIndex:           99998,
          opacity:          0,
          transition:       'opacity 0.15s ease, border-color 0.2s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
          willChange:       'transform',
        }}
      />
    </>
  )
}
