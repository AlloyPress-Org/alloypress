'use client'

import { useEffect } from 'react'
import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { useLexicalComposerContext } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext'
import { $generateNodesFromDOM } from '@payloadcms/richtext-lexical/lexical/html'
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
} from '@payloadcms/richtext-lexical/lexical'
import { toast } from '@payloadcms/ui'

const BLOCK_SELECTOR = 'p,h1,h2,h3,h4,h5,h6,div,blockquote'
const CONCURRENCY = 3

const isImportable = (img: HTMLImageElement) => {
  if (img.hasAttribute('data-lexical-upload-id')) return false // already our own media
  const src = img.getAttribute('src') || ''
  if (src.startsWith('data:image/')) return true
  if (!/^https?:\/\//i.test(src)) return false
  try {
    return new URL(src).host !== window.location.host
  } catch {
    return false
  }
}

// Upload node block-level, so <p> kulla irukka image-a paragraph veliya edukkurom
const hoistImage = (img: HTMLImageElement) => {
  const li = img.closest('li')
  if (li) {
    li.closest('ul,ol')?.after(img)
    return
  }
  if (img.closest('td,th')) return

  const block = img.parentElement?.closest(BLOCK_SELECTOR)
  if (!block || block === block.ownerDocument.body) return

  const onlyImage =
    (block.textContent || '').trim() === '' && block.querySelectorAll('img').length === 1

  if (onlyImage) block.replaceWith(img)
  else block.after(img)
}

const importImage = async (src: string, alt: string): Promise<string | number | null> => {
  try {
    const res = await fetch('/api/media/import-from-url', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: src, alt }),
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.id ?? null
  } catch {
    return null
  }
}

const PasteImagesPlugin = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (!(event instanceof ClipboardEvent)) return false

        const html = event.clipboardData?.getData('text/html')
        if (!html || !/<img[\s>]/i.test(html)) return false

        const doc = new DOMParser().parseFromString(html, 'text/html')
        const imgs = Array.from(doc.querySelectorAll('img')).filter(isImportable)
        if (!imgs.length) return false

        event.preventDefault()

        let savedSelection: ReturnType<typeof $getSelection> = null
        editor.getEditorState().read(() => {
          const sel = $getSelection()
          savedSelection = $isRangeSelection(sel) ? sel.clone() : null
        })

        void (async () => {
          const toastId = toast.loading(`Importing ${imgs.length} image(s)...`)

          // same src dedupe
          const idBySrc = new Map<string, string | number | null>()
          const queue = Array.from(new Set(imgs.map((i) => i.getAttribute('src') as string)))

          const worker = async () => {
            while (queue.length) {
              const src = queue.shift() as string
              const alt = imgs.find((i) => i.getAttribute('src') === src)?.getAttribute('alt') || ''
              idBySrc.set(src, await importImage(src, alt))
            }
          }
          await Promise.all(Array.from({ length: CONCURRENCY }, worker))

          let failed = 0
          for (const img of imgs) {
            const id = idBySrc.get(img.getAttribute('src') as string)
            if (id == null) {
              failed++
              img.remove()
              continue
            }
            img.setAttribute('data-lexical-upload-relation-to', 'media')
            img.setAttribute('data-lexical-upload-id', String(id))
            hoistImage(img)
          }

          editor.update(() => {
            const nodes = $generateNodesFromDOM(editor, doc)
            if (savedSelection) $setSelection(savedSelection)

            const sel = $getSelection()
            if ($isRangeSelection(sel)) sel.insertNodes(nodes)
            else $getRoot().append(...nodes)
          })

          toast.dismiss(toastId)
          if (failed) toast.error(`${failed} image(s) import aagala. Manual-ah add pannunga.`)
          else toast.success('Content pasted with images')
        })()

        return true
      },
      COMMAND_PRIORITY_HIGH,
    )
  }, [editor])

  return null
}

export const PasteImagesClientFeature = createClientFeature({
  plugins: [{ Component: PasteImagesPlugin, position: 'normal' }],
})