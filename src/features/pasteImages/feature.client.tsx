'use client'

import { useEffect, type ReactNode } from 'react'
import { AutoLinkNode, createClientFeature, LinkNode } from '@payloadcms/richtext-lexical/client'
import { useLexicalComposerContext } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext'
import { $generateNodesFromDOM } from '@payloadcms/richtext-lexical/lexical/html'
import { $isQuoteNode } from '@payloadcms/richtext-lexical/lexical/rich-text'
import {
  $getNodeByKey,
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

/**
 * PASTE IMAGES  (Google Docs / web pages / screenshots -> Payload media)
 *
 * Flow
 *  1. paste event is caught in the capture phase (before Payload / Lexical).
 *  2. every <img> becomes a "pending" placeholder node that is inserted INSTANTLY
 *     together with the text, so nothing waits for the network.
 *  3. uploads run in the background (max MAX_PARALLEL across ALL pastes), each with
 *     a timeout and automatic retry for transient errors.
 *  4. when an upload finishes its placeholder is swapped for a real `upload` node.
 *
 * Nothing is dropped silently:
 *  - failed upload            -> red placeholder with the reason + Retry / Remove
 *  - image we cannot fetch    -> red placeholder with the reason + Remove
 *  - hanging request          -> aborted by timeout -> red placeholder + Retry
 *  - placeholder insertion error -> plain-text paste fallback + error toast, no uploads
 *  - leaving the page mid-upload -> browser "unsaved changes" warning
 *  - user deleted the placeholder while uploading -> the orphan media is deleted
 */

const MAX_PARALLEL = 3
const UPLOAD_TIMEOUT_MS = 60_000
const BROWSER_FETCH_TIMEOUT_MS = 15_000
const PASTE_WINDOW_MS = 1000

/* -------------------------------------------------------------------------- */
/* SHARED STATE                                                               */
/* -------------------------------------------------------------------------- */

let pendingCounter = 0
let pendingUploadCount = 0 // uploads currently in flight (for beforeunload)
let linkPasteUntil = 0 // "pasted links open in new tab" window

// pid -> retry callback (registered for failed uploads that can be retried)
const retryHandlers = new Map<string, () => void>()

// Global concurrency limiter: two quick pastes never exceed MAX_PARALLEL uploads
let activeUploads = 0
const waiters: Array<() => void> = []

const acquireSlot = () =>
  new Promise<void>((resolve) => {
    if (activeUploads < MAX_PARALLEL) {
      activeUploads++
      resolve()
    } else {
      waiters.push(() => {
        activeUploads++
        resolve()
      })
    }
  })

const releaseSlot = () => {
  activeUploads--
  waiters.shift()?.()
}

/* -------------------------------------------------------------------------- */
/* DOM HELPERS                                                                */
/* -------------------------------------------------------------------------- */

// Elements that cannot hold a block-level upload node
const CONTAINER_SELECTOR = 'table,ul,ol,p,h1,h2,h3,h4,h5,h6,blockquote,pre'

const outermostContainer = (img: HTMLImageElement): Element | null => {
  let found: Element | null = null
  let el = img.parentElement
  while (el && el.tagName !== 'BODY') {
    if (el.matches(CONTAINER_SELECTOR)) found = el
    el = el.parentElement
  }
  return found
}

/**
 * Upload nodes are block-level, so images inside <p>, lists or tables are moved to
 * right after their container. Order of images is preserved, nothing is lost.
 */
const hoistImages = (imgs: HTMLImageElement[]) => {
  const groups = new Map<Element, HTMLImageElement[]>()

  for (const img of imgs) {
    const container = outermostContainer(img)
    if (!container) continue // already block-level friendly, leave it in place
    groups.set(container, [...(groups.get(container) ?? []), img])
  }

  groups.forEach((list, container) => {
    let anchor: Element = container
    for (const img of list) {
      anchor.after(img)
      anchor = img
    }

    const isTextBlock = !container.matches('table,ul,ol')
    if (
      isTextBlock &&
      (container.textContent || '').trim() === '' &&
      !container.querySelector('img,table,ul,ol')
    ) {
      container.remove()
    }
  })
}

const isTrackingPixel = (img: HTMLImageElement) => {
  const w = Number(img.getAttribute('width'))
  const h = Number(img.getAttribute('height'))
  return (w > 0 && w <= 2) || (h > 0 && h <= 2)
}

const isFetchable = (src: string) => src.startsWith('data:image/') || /^https?:\/\//i.test(src)

/* -------------------------------------------------------------------------- */
/* PENDING IMAGE NODE                                                         */
/* -------------------------------------------------------------------------- */

type SerializedPendingImageNode = Spread<
  { pendingId: string; previewSrc: string },
  SerializedLexicalNode
>

const PendingImagePreview = ({
  src,
  error,
  pendingId,
  nodeKey,
}: {
  src: string
  error: string
  pendingId: string
  nodeKey: NodeKey
}) => {
  const [editor] = useLexicalComposerContext()
  const canRetry = retryHandlers.has(pendingId)

  const btn = {
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid currentColor',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: 12,
  } as const

  return (
    <div
      contentEditable={false}
      style={{
        position: 'relative',
        margin: '12px 0',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--theme-elevation-100, #f2f2f2)',
        border: error ? '1px solid var(--theme-error-500, #e5484d)' : '1px solid transparent',
        minHeight: 120,
      }}
    >
      <style>{`@keyframes ap-spin{to{transform:rotate(360deg)}}`}</style>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          style={{ display: 'block', maxWidth: '100%', maxHeight: 480, margin: '0 auto', opacity: 0.45 }}
        />
      ) : (
        <div style={{ height: 160 }} />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: 13,
          fontWeight: 500,
          padding: 12,
          textAlign: 'center',
        }}
      >
        {error ? (
          <>
            <div style={{ color: 'var(--theme-error-500, #e5484d)' }}>Upload failed: {error}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {canRetry ? (
                <button type="button" style={btn} onClick={() => retryHandlers.get(pendingId)?.()}>
                  Retry
                </button>
              ) : null}
              <button
                type="button"
                style={btn}
                onClick={() => {
                  retryHandlers.delete(pendingId)
                  editor.update(() => {
                    $getNodeByKey(nodeKey)?.remove()
                  })
                }}
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
        )}
      </div>
    </div>
  )
}

export class PendingImageNode extends DecoratorNode<ReactNode> {
  __pendingId: string
  __previewSrc: string
  __error = ''

  static getType(): string {
    return 'pendingImage'
  }

  static clone(node: PendingImageNode): PendingImageNode {
    const copy = new PendingImageNode(node.__pendingId, node.__previewSrc, node.__key)
    copy.__error = node.__error
    return copy
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

  setError(error: string): this {
    const writable = this.getWritable()
    writable.__error = error
    return writable
  }

  exportJSON(): SerializedPendingImageNode {
    // never serialize the (possibly huge) preview. Leftovers are stripped on save
    // by hooks/fixUploadIds.ts
    return {
      ...super.exportJSON(),
      type: 'pendingImage',
      version: 1,
      pendingId: this.__pendingId,
      previewSrc: '',
    }
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
    return (
      <PendingImagePreview
        src={this.__previewSrc}
        error={this.__error}
        pendingId={this.__pendingId}
        nodeKey={this.getKey()}
      />
    )
  }
}

/* -------------------------------------------------------------------------- */
/* UPLOAD (network)                                                           */
/* -------------------------------------------------------------------------- */

type ImportResult = { id: string | number } | { error: string }

const isTimeout = (e: unknown) =>
  e instanceof DOMException && (e.name === 'TimeoutError' || e.name === 'AbortError')

const importImage = async (src: string, alt: string): Promise<ImportResult> => {
  try {
    const res = await fetch('/api/media/import-from-url', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: src, alt }),
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json?.id == null) {
      return { error: json?.error || json?.errors?.[0]?.message || `HTTP ${res.status}` }
    }
    return { id: json.id }
  } catch (e) {
    if (isTimeout(e)) return { error: 'Upload timed out' }
    return { error: e instanceof Error ? e.message : 'Network error' }
  }
}

// best effort: remove media that was uploaded but is not used any more
const deleteOrphanMedia = (id: string | number) => {
  void fetch(`/api/media/${id}`, { method: 'DELETE', credentials: 'include' }).catch(() => {})
}

/**
 * Payload's upload-node DOM import copies the `data-lexical-upload-id` HTML
 * attribute into the node as a STRING. Postgres uses numeric media IDs, so "885"
 * fails validation ("This field is not a valid upload ID"). We convert numeric
 * strings back to numbers. Must be called inside editor.update().
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
 *  2. browser downloads it (CORS-enabled hosts) and sends it as data URL
 *  3. the image file that came with the clipboard (e.g. "Copy image" = html + png)
 */
const resolveImage = async (src: string, alt: string, file?: File): Promise<ImportResult> => {
  let last: ImportResult = { error: 'No image source' }

  if (src) {
    last = await importImage(src, alt)
    if ('id' in last) return last

    if (!src.startsWith('data:')) {
      try {
        const res = await fetch(src, { signal: AbortSignal.timeout(BROWSER_FETCH_TIMEOUT_MS) })
        if (res.ok) {
          const blob = await res.blob()
          if (blob.type.startsWith('image/')) {
            const viaBrowser = await importImage(await fileToDataURL(blob), alt)
            if ('id' in viaBrowser) return viaBrowser
          }
        }
      } catch {
        // CORS / network / timeout -> next fallback
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

const TRANSIENT =
  /(HTTP 5\d\d|HTTP 429|Source responded with (429|5\d\d)|timed out|Network error|Failed to fetch|ECONNRESET|socket hang up|connect)/i

// Retries transient failures (rate limits, 5xx, timeouts) with a short backoff.
const resolveWithRetry = async (src: string, alt: string, file?: File): Promise<ImportResult> => {
  let result = await resolveImage(src, alt, file)
  for (
    let attempt = 1;
    attempt <= 2 && 'error' in result && TRANSIENT.test(result.error);
    attempt++
  ) {
    await new Promise((r) => setTimeout(r, 800 * attempt))
    result = await resolveImage(src, alt, file)
  }
  return result
}

/* -------------------------------------------------------------------------- */
/* PASTE PLUGIN                                                               */
/* -------------------------------------------------------------------------- */

type Item = {
  img: HTMLImageElement
  key: string // uploads with the same key share ONE media doc
  src: string
  alt: string
  pid: string
  file?: File
  objectUrl?: string
  unsupported?: string // cannot be uploaded -> shown as an error placeholder
}

const UNSUPPORTED_MESSAGE =
  'This image is not accessible from the browser (local file / blob). Add it manually.'

const PasteImagesPlugin = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const hasPlaceholder = (pid: string) =>
      editor
        .getEditorState()
        .read(() => $nodesOfType(PendingImageNode).some((n) => n.getPendingId() === pid))

    // Replace the placeholder with the real upload node, or mark it as failed.
    const settle = (pid: string, result: ImportResult) => {
      editor.update(() => {
        const placeholder = $nodesOfType(PendingImageNode).find((n) => n.getPendingId() === pid)
        if (!placeholder) return // user deleted it meanwhile

        if ('error' in result) {
          placeholder.setError(result.error) // stays visible with Retry / Remove
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
        else placeholder.setError('Could not insert the uploaded image. Add it manually.')
      })
    }

    // Uploads ONE group (items sharing a source) and settles all of its placeholders.
    const processGroup = async (group: Item[]): Promise<boolean> => {
      const first = group[0]
      pendingUploadCount += group.length

      let result: ImportResult
      await acquireSlot()
      try {
        result = await resolveWithRetry(first.src, first.alt, first.file)
      } catch (e) {
        result = { error: e instanceof Error ? e.message : 'Unexpected error' }
      } finally {
        releaseSlot()
        pendingUploadCount -= group.length
      }

      if ('error' in result) {
        console.warn('[paste-images] upload failed', {
          src: first.src.slice(0, 200),
          error: result.error,
        })

        for (const item of group) {
          retryHandlers.set(item.pid, () => {
            // clear the error, show the spinner again, run just this image
            editor.update(() => {
              $nodesOfType(PendingImageNode)
                .find((n) => n.getPendingId() === item.pid)
                ?.setError('')
            })
            void processGroup([item])
          })
          settle(item.pid, result)
        }
        return false
      }

      // all placeholders gone (user deleted them) -> the media would be orphaned
      const used = group.some((item) => hasPlaceholder(item.pid))

      for (const item of group) {
        retryHandlers.delete(item.pid)
        if (item.objectUrl) URL.revokeObjectURL(item.objectUrl)
        settle(item.pid, result)
      }

      if (!used) deleteOrphanMedia(result.id)
      return true
    }

    const startUploads = (items: Item[]) => {
      const byKey = new Map<string, Item[]>()
      for (const item of items) {
        if (item.unsupported) continue
        byKey.set(item.key, [...(byKey.get(item.key) ?? []), item])
      }

      void (async () => {
        const outcomes = await Promise.all(
          Array.from(byKey.values()).map((group) =>
            processGroup(group).then((ok) => (ok ? 0 : group.length)),
          ),
        )
        const failed = outcomes.reduce((sum, n) => sum + n, 0)

        if (failed) {
          toast.error(
            `${failed} image(s) upload aagala. Editor-la red box-la Retry / Remove button irukku.`,
          )
        }
      })()
    }

    const onPaste = (event: ClipboardEvent) => {
      const data = event.clipboardData
      if (!data) return

      const html = data.getData('text/html')
      const plain = data.getData('text/plain')
      const files = Array.from(data.files || []).filter((f) => f.type.startsWith('image/'))

      const doc = new DOMParser().parseFromString(html || '<body></body>', 'text/html')

      // every real image (our own upload nodes and tracking pixels are skipped)
      const candidates = Array.from(doc.querySelectorAll('img')).filter(
        (img) =>
          !img.hasAttribute('data-lexical-upload-id') &&
          !isTrackingPixel(img) &&
          (img.getAttribute('src') || '').trim() !== '',
      )
      const hasText = (doc.body.textContent || '').trim() !== ''

      // screenshot / "copy image" with no usable html -> upload the file(s) directly
      const fileOnly = files.length > 0 && candidates.length === 0 && !hasText

      if (!candidates.length && !fileOnly) return // normal paste, not ours

      // stop Payload's default upload drawer from opening
      event.preventDefault()
      event.stopImmediatePropagation()

      // stopImmediatePropagation also blocks the link plugin's own paste listener,
      // so arm the "new tab" window here and mark every pasted anchor explicitly.
      linkPasteUntil = Date.now() + PASTE_WINDOW_MS
      doc.querySelectorAll('a[href]').forEach((a) => a.setAttribute('target', '_blank'))

      // ---- build the work list -------------------------------------------------
      let fileCursor = 0
      const items: Item[] = fileOnly
        ? files.map((file, i) => {
            const img = doc.createElement('img')
            doc.body.append(img)
            return { img, key: `file:${i}`, src: '', alt: '', pid: '', file }
          })
        : candidates.map((img, i) => {
            const src = (img.getAttribute('src') || '').trim()
            // Google Docs alt text -> media alt (server also copies it to caption)
            const alt = (img.getAttribute('alt') || img.getAttribute('title') || '').trim()

            if (isFetchable(src)) {
              return {
                img,
                key: src,
                src,
                alt,
                pid: '',
                // "Copy image" gives html + file: keep the file as last-resort fallback
                file: candidates.length === 1 && files.length === 1 ? files[0] : undefined,
              }
            }

            // blob: / file: / relative src -> use a clipboard file if one is left
            const file = files[fileCursor++]
            if (file) return { img, key: `file:${i}`, src: '', alt, pid: '', file }

            return { img, key: `bad:${i}`, src: '', alt, pid: '', unsupported: UNSUPPORTED_MESSAGE }
          })

      const cleanup = () => {
        for (const item of items) if (item.objectUrl) URL.revokeObjectURL(item.objectUrl)
      }

      let insertFailed = false

      try {
        // 1) tag every image as "pending" with an instant local preview
        for (const item of items) {
          item.pid = `pending-${Date.now()}-${pendingCounter++}`
          if (item.file) item.objectUrl = URL.createObjectURL(item.file)
          item.img.setAttribute('data-pending-id', item.pid)
          item.img.setAttribute('data-preview-src', item.objectUrl || item.src)
        }
        hoistImages(items.map((item) => item.img))
      } catch (e) {
        console.error('[paste-images] could not prepare paste', e)
        insertFailed = true
      }

      let savedSelection: ReturnType<typeof $getSelection> = null
      editor.getEditorState().read(() => {
        const sel = $getSelection()
        savedSelection = $isRangeSelection(sel) ? sel.clone() : null
      })

      // 2) insert text + placeholders RIGHT NOW (no waiting for uploads)
      editor.update(
        () => {
          const fallbackToPlainText = () => {
            const sel = $getSelection()
            if (plain && $isRangeSelection(sel)) sel.insertRawText(plain)
          }

          if (insertFailed) {
            fallbackToPlainText()
            return
          }

          try {
            const nodes = $generateNodesFromDOM(editor, doc)
            if (savedSelection) $setSelection(savedSelection)

            const sel = $getSelection()
            if ($isRangeSelection(sel)) sel.insertNodes(nodes)
            else $getRoot().append(...nodes)
          } catch (e) {
            console.error('[paste-images] could not insert pasted content', e)
            insertFailed = true
            fallbackToPlainText()
          }
        },
        {
          // runs after the placeholders are committed, so uploads can always find them
          onUpdate: () => {
            if (insertFailed) {
              cleanup()
              toast.error(
                'Paste fail aachu. Text mattum paste aagirukku, images-ah manual-ah add pannunga.',
              )
              return
            }

            // images that can never be uploaded: show why, instead of dropping them
            for (const item of items) {
              if (item.unsupported) settle(item.pid, { error: item.unsupported })
            }

            // 3) upload in background, swap each placeholder when ITS upload finishes
            startUploads(items)
          },
        },
      )
    }

    // warn before closing / reloading while uploads are still running
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (pendingUploadCount > 0) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)

    // capture phase on the editor root -> runs before Lexical / Payload paste handlers
    const unregisterRoot = editor.registerRootListener((root, prevRoot) => {
      prevRoot?.removeEventListener('paste', onPaste, true)
      root?.addEventListener('paste', onPaste, true)
    })

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      unregisterRoot()
    }
  }, [editor])

  return null
}

/* -------------------------------------------------------------------------- */
/* MULTI-PARAGRAPH PASTE INSIDE A QUOTE                                       */
/* Lexical's Quote can only hold inline content, so pasting several paragraphs */
/* into it puts the first one inside and pushes the rest OUTSIDE the quote.   */
/* Here the paragraphs are joined with line breaks so everything stays inside */
/* the same quote (links, bold, italic are kept).                             */
/* -------------------------------------------------------------------------- */

const LEAF_BLOCK_SELECTOR = 'p,div,h1,h2,h3,h4,h5,h6,li,pre,blockquote'
const HEADING = /^H[1-6]$/

const QuotePastePlugin = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const isInsideQuote = () =>
      editor.getEditorState().read(() => {
        const sel = $getSelection()
        if (!$isRangeSelection(sel)) return false
        return $isQuoteNode(sel.anchor.getNode().getTopLevelElement())
      })

    // paragraphs of the clipboard as DOM fragments (html) or text lines (plain)
    const collectParagraphs = (html: string, plain: string, doc: Document): Node[][] => {
      if (html) {
        const parsed = new DOMParser().parseFromString(html, 'text/html')
        const leaves = Array.from(parsed.body.querySelectorAll(LEAF_BLOCK_SELECTOR)).filter(
          (el) => !el.querySelector(LEAF_BLOCK_SELECTOR),
        )

        // links opened from a quote also open in a new tab
        parsed.body.querySelectorAll('a[href]').forEach((a) => a.setAttribute('target', '_blank'))

        return leaves
          .filter((el) => (el.textContent || '').trim() !== '')
          .map((el) => {
            const nodes = Array.from(el.childNodes).map((n) => doc.importNode(n, true))
            if (el.tagName === 'LI') nodes.unshift(doc.createTextNode('• '))
            if (HEADING.test(el.tagName)) {
              const strong = doc.createElement('strong')
              nodes.forEach((n) => strong.append(n))
              return [strong]
            }
            return nodes
          })
      }

      return plain
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => [doc.createTextNode(line)])
    }

    const onPaste = (event: ClipboardEvent) => {
      const data = event.clipboardData
      if (!data || !isInsideQuote()) return

      const html = data.getData('text/html')
      const plain = data.getData('text/plain')

      const doc = new DOMParser().parseFromString('<body></body>', 'text/html')
      const paragraphs = collectParagraphs(html, plain, doc)

      if (paragraphs.length < 2) return // single paragraph -> normal paste

      event.preventDefault()
      event.stopImmediatePropagation() // also skips the link plugin's listener
      linkPasteUntil = Date.now() + PASTE_WINDOW_MS

      // p1 <br><br> p2 <br><br> p3 ...  (all inline, so it stays inside the quote)
      paragraphs.forEach((nodes, i) => {
        nodes.forEach((n) => doc.body.append(n))
        if (i < paragraphs.length - 1) {
          doc.body.append(doc.createElement('br'), doc.createElement('br'))
        }
      })

      editor.update(() => {
        try {
          const sel = $getSelection()
          if (!$isRangeSelection(sel)) return
          sel.insertNodes($generateNodesFromDOM(editor, doc))
        } catch (e) {
          console.error('[paste-images] quote paste failed', e)
          toast.error('Quote-la paste fail aachu. Oru paragraph oru paragraph-ah paste pannunga.')
        }
      })
    }

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
    { Component: QuotePastePlugin, position: 'normal' },
    { Component: LinkNewTabPlugin, position: 'normal' },
  ],
})