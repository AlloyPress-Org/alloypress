'use client'

import { useEffect, type ReactNode } from 'react'
import { AutoLinkNode, createClientFeature, LinkNode } from '@payloadcms/richtext-lexical/client'
import { useLexicalComposerContext } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext'
import { $generateNodesFromDOM } from '@payloadcms/richtext-lexical/lexical/html'
import {
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $nodesOfType,
  $setSelection,
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
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

/* -------------------------------------------------------------------------- */
/* PENDING IMAGE NODE                                                         */
/* Instant local preview + spinner while the real upload runs in background.  */
/* It is swapped for a real `upload` node when the upload finishes, and any   */
/* leftover is stripped server-side (see hooks/fixUploadIds.ts).              */
/* -------------------------------------------------------------------------- */

type SerializedPendingImageNode = Spread<
  { pendingId: string; previewSrc: string },
  SerializedLexicalNode
>

const PendingImagePreview = ({ src }: { src: string }) => (
  <div
    contentEditable={false}
    style={{
      position: 'relative',
      margin: '12px 0',
      borderRadius: 8,
      overflow: 'hidden',
      background: 'var(--theme-elevation-100, #f2f2f2)',
      minHeight: 120,
    }}
  >
    <style>{`@keyframes ap-spin{to{transform:rotate(360deg)}}`}</style>
    {src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        style={{ display: 'block', maxWidth: '100%', maxHeight: 480, margin: '0 auto', opacity: 0.55 }}
      />
    ) : (
      <div style={{ height: 160 }} />
    )}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'ap-spin 0.8s linear infinite',
        }}
      />
      Uploading…
    </div>
  </div>
)

export class PendingImageNode extends DecoratorNode<ReactNode> {
  __pendingId: string
  __previewSrc: string

  static getType(): string {
    return 'pendingImage'
  }

  static clone(node: PendingImageNode): PendingImageNode {
    return new PendingImageNode(node.__pendingId, node.__previewSrc, node.__key)
  }

  static importJSON(serialized: SerializedPendingImageNode): PendingImageNode {
    return new PendingImageNode(serialized.pendingId, '')
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) =>
        (node as HTMLElement).hasAttribute('data-pending-id')
          ? {
              conversion: (el: Node) => ({
                node: new PendingImageNode(
                  (el as HTMLElement).getAttribute('data-pending-id') as string,
                  (el as HTMLElement).getAttribute('data-preview-src') || '',
                ),
              }),
              priority: 2,
            }
          : null,
    }
  }

  constructor(pendingId: string, previewSrc: string, key?: NodeKey) {
    super(key)
    this.__pendingId = pendingId
    this.__previewSrc = previewSrc
  }

  getPendingId(): string {
    return this.getLatest().__pendingId
  }

  exportJSON(): SerializedPendingImageNode {
    // never serialize the (possibly huge) preview
    return { ...super.exportJSON(), type: 'pendingImage', version: 1, pendingId: this.__pendingId, previewSrc: '' }
  }

  exportDOM(): DOMExportOutput {
    return { element: document.createElement('span') }
  }

  createDOM(): HTMLElement {
    return document.createElement('div')
  }

  updateDOM(): false {
    return false
  }

  isInline(): false {
    return false
  }

  decorate(): ReactNode {
    return <PendingImagePreview src={this.__previewSrc} />
  }
}

type ImportResult = { id: string | number } | { error: string }

const importImage = async (src: string, alt: string): Promise<ImportResult> => {
  try {
    const res = await fetch('/api/media/import-from-url', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: src, alt }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json?.id == null) {
      return { error: json?.error || json?.errors?.[0]?.message || `HTTP ${res.status}` }
    }
    return { id: json.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Network error' }
  }
}

/**
 * Payload's upload-node DOM import (conversions.js) copies the
 * `data-lexical-upload-id` HTML attribute into the node as a STRING.
 * This DB (Postgres) uses numeric media IDs, so "885" fails validation with
 * "upload node failed to validate: This field is not a valid upload ID."
 * After the nodes are generated we convert numeric-string IDs back to numbers.
 * Must be called inside editor.update().
 */
type UploadData = { value?: unknown; [key: string]: unknown }
type UploadLikeNode = LexicalNode & {
  getData: () => UploadData
  setData: (data: UploadData) => void
}

const isUploadLikeNode = (node: LexicalNode): node is UploadLikeNode => {
  const n = node as Partial<UploadLikeNode>
  return (
    node.getType() === 'upload' &&
    typeof n.getData === 'function' &&
    typeof n.setData === 'function'
  )
}

const fixUploadIds = (nodes: LexicalNode[]) => {
  for (const node of nodes) {
    if (isUploadLikeNode(node)) {
      const data = node.getData()
      if (typeof data?.value === 'string' && /^\d+$/.test(data.value)) {
        node.setData({ ...data, value: Number(data.value) })
      }
    }
    if ($isElementNode(node)) fixUploadIds(node.getChildren())
  }
}

const fileToDataURL = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

/**
 * Tries, in order:
 *  1. server downloads the URL (works for almost every public image / data: URL)
 *  2. browser downloads it (works for CORS-enabled hosts) and sends it as data URL
 *  3. the image file that came with the clipboard (e.g. "Copy image" gives html + png)
 */
const resolveImage = async (src: string, alt: string, file?: File): Promise<ImportResult> => {
  let last: ImportResult = { error: 'No image source' }

  if (src) {
    last = await importImage(src, alt)
    if ('id' in last) return last

    if (!src.startsWith('data:')) {
      try {
        const res = await fetch(src)
        if (res.ok) {
          const blob = await res.blob()
          if (blob.type.startsWith('image/')) {
            const viaBrowser = await importImage(await fileToDataURL(blob), alt)
            if ('id' in viaBrowser) return viaBrowser
          }
        }
      } catch {
        // CORS / network -> try next fallback
      }
    }
  }

  if (file) {
    try {
      last = await importImage(await fileToDataURL(file), alt)
    } catch (e) {
      last = { error: e instanceof Error ? e.message : 'Could not read pasted file' }
    }
  }

  return last
}

type Item = {
  img: HTMLImageElement
  key: string
  src: string
  alt: string
  pid: string
  file?: File
  objectUrl?: string
}

let pendingCounter = 0

const PasteImagesPlugin = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // Replace the placeholder with the real upload node (or drop it on failure)
    const settle = (pid: string, result: ImportResult) => {
      editor.update(() => {
        const placeholder = $nodesOfType(PendingImageNode).find((n) => n.getPendingId() === pid)
        if (!placeholder) return // user deleted it meanwhile

        if ('error' in result) {
          placeholder.remove()
          return
        }

        const tmp = new DOMParser().parseFromString('<body></body>', 'text/html')
        const img = tmp.createElement('img')
        img.setAttribute('data-lexical-upload-relation-to', 'media')
        img.setAttribute('data-lexical-upload-id', String(result.id))
        tmp.body.append(img)

        const nodes = $generateNodesFromDOM(editor, tmp)
        fixUploadIds(nodes)

        if (nodes.length) placeholder.replace(nodes[0])
        else placeholder.remove()
      })
    }

    const onPaste = (event: ClipboardEvent) => {
      const data = event.clipboardData
      if (!data) return

      const html = data.getData('text/html')
      const files = Array.from(data.files || []).filter((f) => f.type.startsWith('image/'))

      const doc = new DOMParser().parseFromString(html || '<body></body>', 'text/html')
      const htmlImgs = Array.from(doc.querySelectorAll('img')).filter(isImportable)
      const hasText = (doc.body.textContent || '').trim() !== ''

      // screenshot / "copy image" with no usable html -> upload the file(s) directly
      const fileOnly = files.length > 0 && htmlImgs.length === 0 && !hasText

      if (!htmlImgs.length && !fileOnly) return // normal paste

      // stop Payload's default upload drawer from opening
      event.preventDefault()
      event.stopImmediatePropagation()

      const items: Item[] = fileOnly
        ? files.map((file, i) => {
            const img = doc.createElement('img')
            doc.body.append(img)
            return { img, key: `file:${i}`, src: '', alt: '', pid: '', file }
          })
        : htmlImgs.map((img, i) => ({
            img,
            key: img.getAttribute('src') as string,
            src: img.getAttribute('src') as string,
            // Google Docs alt text -> media alt (server also copies it to caption)
            alt: (img.getAttribute('alt') || img.getAttribute('title') || '').trim(),
            pid: '',
            file: htmlImgs.length === 1 && files.length === 1 && i === 0 ? files[0] : undefined,
          }))

      // 1) tag every image as "pending" with an instant local preview
      for (const item of items) {
        item.pid = `pending-${Date.now()}-${pendingCounter++}`
        if (item.file) item.objectUrl = URL.createObjectURL(item.file)
        item.img.setAttribute('data-pending-id', item.pid)
        item.img.setAttribute('data-preview-src', item.objectUrl || item.src)
        hoistImage(item.img)
      }

      let savedSelection: ReturnType<typeof $getSelection> = null
      editor.getEditorState().read(() => {
        const sel = $getSelection()
        savedSelection = $isRangeSelection(sel) ? sel.clone() : null
      })

      // 2) insert text + placeholders RIGHT NOW (no waiting for uploads)
      editor.update(() => {
        const nodes = $generateNodesFromDOM(editor, doc)
        if (savedSelection) $setSelection(savedSelection)

        const sel = $getSelection()
        if ($isRangeSelection(sel)) sel.insertNodes(nodes)
        else $getRoot().append(...nodes)
      })

      // 3) upload in background, swap each placeholder as soon as ITS upload finishes
      void (async () => {
        const byKey = new Map<string, Item[]>()
        for (const item of items) byKey.set(item.key, [...(byKey.get(item.key) ?? []), item])

        const queue = Array.from(byKey.values()).map((group) => group[0])
        let failed = 0
        const reasons = new Set<string>()

        const worker = async () => {
          while (queue.length) {
            const first = queue.shift() as Item
            const result = await resolveImage(first.src, first.alt, first.file)
            const group = byKey.get(first.key) as Item[]

            if ('error' in result) {
              failed += group.length
              reasons.add(result.error)
            }
            for (const item of group) {
              settle(item.pid, result)
              if (item.objectUrl) URL.revokeObjectURL(item.objectUrl)
            }
          }
        }

        await Promise.all(Array.from({ length: CONCURRENCY }, worker))

        if (failed) {
          toast.error(
            `${failed} image(s) import aagala (${[...reasons].join(', ')}). Manual-ah add pannunga.`,
          )
        }
      })()
    }

    // capture phase on the editor root -> runs before Lexical / Payload paste handlers
    return editor.registerRootListener((root, prevRoot) => {
      prevRoot?.removeEventListener('paste', onPaste, true)
      root?.addEventListener('paste', onPaste, true)
    })
  }, [editor])

  return null
}

/* -------------------------------------------------------------------------- */
/* PASTED LINKS OPEN IN A NEW TAB                                             */
/* Google Docs / web links carry no target="_blank", so Payload imports them  */
/* with newTab = false. For ~1s after every paste we force newTab = true on   */
/* any link node. Links the user edits later are never touched.               */
/* -------------------------------------------------------------------------- */

const PASTE_WINDOW_MS = 1000
let linkPasteUntil = 0

const LinkNewTabPlugin = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const markPaste = () => {
      linkPasteUntil = Date.now() + PASTE_WINDOW_MS
    }

    const forceNewTab = (node: LinkNode | AutoLinkNode) => {
      if (Date.now() > linkPasteUntil) return
      const fields = node.getFields()
      if (fields?.newTab) return
      node.setFields({ ...fields, newTab: true })
    }

    const unregisterRoot = editor.registerRootListener((root, prevRoot) => {
      prevRoot?.removeEventListener('paste', markPaste, true)
      root?.addEventListener('paste', markPaste, true)
    })
    const unregisterLink = editor.registerNodeTransform(LinkNode, (node) => forceNewTab(node))
    const unregisterAuto = editor.registerNodeTransform(AutoLinkNode, (node) => forceNewTab(node))

    return () => {
      unregisterRoot()
      unregisterLink()
      unregisterAuto()
    }
  }, [editor])

  return null
}

export const PasteImagesClientFeature = createClientFeature({
  nodes: [PendingImageNode],
  plugins: [
    { Component: PasteImagesPlugin, position: 'normal' },
    { Component: LinkNewTabPlugin, position: 'normal' },
  ],
})