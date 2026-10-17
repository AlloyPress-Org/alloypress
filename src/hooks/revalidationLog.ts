export type RevalidationStatus = 'pending' | 'success' | 'error'

export type RevalidationEntry = {
  id: string
  label: string
  status: RevalidationStatus
  message?: string
  startedAt: number
  finishedAt?: number
}

const KEY = '__alloypressRevalidationLog'
const MAX_ENTRIES = 50

type GlobalWithLog = typeof globalThis & { [KEY]?: RevalidationEntry[] }

const store = (): RevalidationEntry[] => {
  const g = globalThis as GlobalWithLog
  if (!g[KEY]) g[KEY] = []
  return g[KEY]
}

let counter = 0

// NOTE: logging must never break a publish or the revalidation itself,
// so every function here swallows its own errors.
export function startRevalidation(label: string): string {
  const id = `${Date.now()}-${++counter}`
  try {
    const entries = store()
    entries.push({ id, label, status: 'pending', startedAt: Date.now() })
    while (entries.length > MAX_ENTRIES) entries.shift()
  } catch {
    // ignore
  }
  return id
}

export function finishRevalidation(
  id: string,
  status: 'success' | 'error',
  message?: string,
): void {
  try {
    const entry = store().find((e) => e.id === id)
    if (!entry) return
    entry.status = status
    entry.message = message?.slice(0, 200)
    entry.finishedAt = Date.now()
  } catch {
    // ignore
  }
}

/** Entries that started or finished at/after `since` (ms epoch). */
export function revalidationEntriesSince(since: number): RevalidationEntry[] {
  try {
    return store().filter((e) => (e.finishedAt ?? e.startedAt) >= since)
  } catch {
    return []
  }
}