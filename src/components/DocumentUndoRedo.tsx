'use client'

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { useAllFormFields } from '@payloadcms/ui'

import type { BeforeDocumentControlsClientProps } from 'payload'

import { reduceFieldsToValues } from 'payload/shared'

type Snapshot = Record<string, unknown>

const MAX_HISTORY = 50
const SAVE_DELAY = 500

// ============================================================
// HELPERS
// ============================================================

// True when the user is typing inside the rich text editor, a text input,
// a textarea or a select. In those places we must NOT hijack Ctrl+Z:
// the Lexical editor / browser already has its own (line-level) undo.
const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false

  if (target.isContentEditable) return true

  const tag = target.tagName

  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

// Remember scroll position of the window and every scrolled container,
// so we can put it back after the form restore re-renders the editor.
const captureScroll = () => {
  const items: Array<{ el: Element; top: number; left: number }> = []

  document.querySelectorAll('*').forEach((el) => {
    if (el.scrollTop > 0 || el.scrollLeft > 0) {
      items.push({ el, top: el.scrollTop, left: el.scrollLeft })
    }
  })

  return {
    windowX: window.scrollX,
    windowY: window.scrollY,
    items,
  }
}

const restoreScroll = (saved: ReturnType<typeof captureScroll>) => {
  const apply = () => {
    window.scrollTo(saved.windowX, saved.windowY)

    saved.items.forEach(({ el, top, left }) => {
      el.scrollTop = top
      el.scrollLeft = left
    })
  }

  // run a few times: the editor re-renders asynchronously
  requestAnimationFrame(() => {
    apply()
    requestAnimationFrame(apply)
  })

  setTimeout(apply, 60)
  setTimeout(apply, 150)
}

export const DocumentUndoRedo = (
  _props: BeforeDocumentControlsClientProps,
) => {
  const [fields, dispatchFields] = useAllFormFields()

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const historyRef = useRef<Snapshot[]>([])
  const historyIndexRef = useRef(-1)

  const restoringRef = useRef(false)
  const initializedRef = useRef(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ============================================================
  // CREATE SNAPSHOT
  // ============================================================

  const getSnapshot = useCallback((): Snapshot => {
    const values = reduceFieldsToValues(fields, true)

    return structuredClone(values)
  }, [fields])

  // ============================================================
  // COMPARE SNAPSHOTS
  // ============================================================

  const snapshotsEqual = useCallback(
    (a: Snapshot, b: Snapshot) => {
      return JSON.stringify(a) === JSON.stringify(b)
    },
    [],
  )

  // ============================================================
  // UPDATE BUTTON STATE
  // ============================================================

  const updateButtons = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0)

    setCanRedo(
      historyIndexRef.current >= 0 &&
        historyIndexRef.current <
          historyRef.current.length - 1,
    )
  }, [])

  // ============================================================
  // CAPTURE FORM CHANGES
  // ============================================================

  useEffect(() => {
    // Ignore state change caused by Undo / Redo restore
    if (restoringRef.current) {
      restoringRef.current = false
      return
    }

    const snapshot = getSnapshot()

    // ----------------------------------------------------------
    // FIRST SNAPSHOT
    // ----------------------------------------------------------

    if (!initializedRef.current) {
      historyRef.current = [snapshot]
      historyIndexRef.current = 0

      initializedRef.current = true

      updateButtons()

      return
    }

    // ----------------------------------------------------------
    // DEBOUNCE
    // ----------------------------------------------------------

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      const currentHistory = historyRef.current

      const currentIndex = historyIndexRef.current

      const currentSnapshot =
        currentHistory[currentIndex]

      // No actual change
      if (
        currentSnapshot &&
        snapshotsEqual(currentSnapshot, snapshot)
      ) {
        return
      }

      // --------------------------------------------------------
      // REMOVE REDO HISTORY
      // --------------------------------------------------------

      const newHistory = currentHistory.slice(
        0,
        currentIndex + 1,
      )

      // Add new snapshot
      newHistory.push(snapshot)

      // --------------------------------------------------------
      // LIMIT HISTORY
      // --------------------------------------------------------

      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift()
      }

      historyRef.current = newHistory

      historyIndexRef.current =
        newHistory.length - 1

      updateButtons()
    }, SAVE_DELAY)

    // ----------------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------------

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [
    fields,
    getSnapshot,
    snapshotsEqual,
    updateButtons,
  ])

  // ============================================================
  // RESTORE SNAPSHOT
  // Only fields that really changed are dispatched (so the rest of the
  // form, e.g. the big content editor, is NOT re-rendered / reset),
  // and the scroll position is put back afterwards.
  // ============================================================

  const restoreSnapshot = useCallback(
    (snapshot: Snapshot) => {
      const current = getSnapshot()

      const changed = Object.entries(snapshot).filter(
        ([path, value]) =>
          JSON.stringify(current[path]) !==
          JSON.stringify(value),
      )

      // Nothing to restore. Do NOT set restoringRef, otherwise the next
      // real edit would be swallowed.
      if (changed.length === 0) {
        return
      }

      const savedScroll = captureScroll()

      restoringRef.current = true

      changed.forEach(([path, value]) => {
        dispatchFields({
          type: 'UPDATE',
          path,
          value,
          initialValue: value,
        })
      })

      restoreScroll(savedScroll)
    },
    [dispatchFields, getSnapshot],
  )

  // ============================================================
  // UNDO
  // ============================================================

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) {
      return
    }

    const newIndex =
      historyIndexRef.current - 1

    historyIndexRef.current = newIndex

    const snapshot =
      historyRef.current[newIndex]

    if (!snapshot) {
      return
    }

    restoreSnapshot(snapshot)

    updateButtons()
  }, [
    restoreSnapshot,
    updateButtons,
  ])

  // ============================================================
  // REDO
  // ============================================================

  const handleRedo = useCallback(() => {
    if (
      historyIndexRef.current >=
      historyRef.current.length - 1
    ) {
      return
    }

    const newIndex =
      historyIndexRef.current + 1

    historyIndexRef.current = newIndex

    const snapshot =
      historyRef.current[newIndex]

    if (!snapshot) {
      return
    }

    restoreSnapshot(snapshot)

    updateButtons()
  }, [
    restoreSnapshot,
    updateButtons,
  ])

  // ============================================================
  // KEYBOARD SHORTCUTS
  // Skipped while typing in the editor / inputs: Lexical's own
  // undo handles it (only the line you edited changes, no shake).
  // ============================================================

  useEffect(() => {
    const handleKeyboard = (
      event: KeyboardEvent,
    ) => {
      const modifier =
        event.ctrlKey || event.metaKey

      if (!modifier) {
        return
      }

      // Let the editor / input use its own native undo & redo
      if (isEditableTarget(event.target)) {
        return
      }

      const key =
        event.key.toLowerCase()

      // --------------------------------------------------------
      // CTRL + Z
      // --------------------------------------------------------

      if (
        key === 'z' &&
        !event.shiftKey
      ) {
        event.preventDefault()

        handleUndo()

        return
      }

      // --------------------------------------------------------
      // CTRL + SHIFT + Z
      // --------------------------------------------------------

      if (
        key === 'z' &&
        event.shiftKey
      ) {
        event.preventDefault()

        handleRedo()

        return
      }

      // --------------------------------------------------------
      // CTRL + Y
      // --------------------------------------------------------

      if (key === 'y') {
        event.preventDefault()

        handleRedo()
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyboard,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyboard,
      )
    }
  }, [
    handleUndo,
    handleRedo,
  ])

  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginRight: '8px',
      }}
    >
      {/* ======================================================
          UNDO
      ====================================================== */}

      <button
        type="button"
        onClick={handleUndo}
        disabled={!canUndo}
        title="Undo (Ctrl + Z)"
        style={{
          height: '36px',
          padding: '0 12px',
          borderRadius: '4px',
          border:
            '1px solid var(--theme-elevation-150)',
          background:
            'var(--theme-elevation-50)',
          color: 'var(--theme-text)',
          cursor: canUndo
            ? 'pointer'
            : 'not-allowed',
          opacity: canUndo ? 1 : 0.45,
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        ↶ Undo
      </button>

      {/* ======================================================
          REDO
      ====================================================== */}

      <button
        type="button"
        onClick={handleRedo}
        disabled={!canRedo}
        title="Redo (Ctrl + Shift + Z)"
        style={{
          height: '36px',
          padding: '0 12px',
          borderRadius: '4px',
          border:
            '1px solid var(--theme-elevation-150)',
          background:
            'var(--theme-elevation-50)',
          color: 'var(--theme-text)',
          cursor: canRedo
            ? 'pointer'
            : 'not-allowed',
          opacity: canRedo ? 1 : 0.45,
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        ↷ Redo
      </button>
    </div>
  )
}