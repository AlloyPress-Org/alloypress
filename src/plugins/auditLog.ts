import type {
    CollectionAfterChangeHook,
    CollectionAfterDeleteHook,
    CollectionAfterLoginHook,
    CollectionBeforeDeleteHook,
    PayloadRequest,
    Plugin,
} from 'payload'

const AUDIT_SLUG = 'audit-logs'

const LOG_SYSTEM_EVENTS = false

const MERGE_WINDOW_MS = 10 * 60 * 1000

const IGNORED_FIELDS = new Set([
    'id',
    'createdAt',
    'updatedAt',
    '_status',
    'sizes',
    'hash',
    'salt',
    'password',
    'sessions',
    'loginAttempts',
    'lockUntil',
    'resetPasswordToken',
    'resetPasswordExpiration',
])

type Action = 'create' | 'update' | 'draft' | 'publish' | 'delete' | 'login'

type Change = {
    field: string
    from?: unknown
    to?: unknown
    words?: { from: number; to: number }
    note?: string
}

const VERB: Record<Action, string> = {
    create: 'created',
    update: 'updated',
    draft: 'saved a draft of',
    publish: 'published',
    delete: 'deleted',
    login: 'logged in',
}

const isSimple = (v: unknown) =>
    v === null ||
    v === undefined ||
    typeof v === 'string' ||
    typeof v === 'number' ||
    typeof v === 'boolean'

const clip = (v: unknown) =>
    typeof v === 'string' && v.length > 200 ? `${v.slice(0, 200)}…` : v

const titleOf = (doc: any): string =>
    String(
        doc?.title ??
        doc?.name ??
        doc?.filename ??
        doc?.email ??
        doc?.slug ??
        doc?.id ??
        '',
    )

const isLexical = (v: any): boolean =>
    Boolean(v) && typeof v === 'object' && Array.isArray(v?.root?.children)

function countWords(value: any): number {
    let words = 0

    const walk = (node: any) => {
        if (!node || typeof node !== 'object') return

        if (typeof node.text === 'string') {
            words += node.text.split(/\s+/).filter(Boolean).length
        }

        if (Array.isArray(node.children)) {
            node.children.forEach(walk)
        }
    }

    walk(value?.root)

    return words
}

function wordsNote(from: number, to: number): string {
    const delta = to - from

    if (delta === 0) return 'edited'

    return `${delta > 0 ? '+' : ''}${delta} words`
}

const fieldsLabel = (changes: Change[]): string =>
    changes.map((c) => (c.note ? `${c.field} (${c.note})` : c.field)).join(', ') ||
    '—'

function diffDocs(prev: any, next: any): Change[] {
    const changes: Change[] = []
    const keys = new Set([
        ...Object.keys(prev ?? {}),
        ...Object.keys(next ?? {}),
    ])

    for (const key of keys) {
        if (IGNORED_FIELDS.has(key)) continue

        const a = prev?.[key]
        const b = next?.[key]

        if (JSON.stringify(a) === JSON.stringify(b)) continue

        if (isLexical(a) || isLexical(b)) {
            const from = countWords(a)
            const to = countWords(b)

            changes.push({
                field: key,
                words: { from, to },
                note: wordsNote(from, to),
            })

            continue
        }

        changes.push(
            isSimple(a) && isSimple(b)
                ? { field: key, from: clip(a), to: clip(b) }
                : { field: key },
        )
    }

    return changes
}

function mergeChanges(oldList: Change[] = [], newList: Change[] = []): Change[] {
    const map = new Map<string, Change>()

    for (const c of oldList) map.set(c.field, c)

    for (const c of newList) {
        const prev = map.get(c.field)

        if (!prev) {
            map.set(c.field, c)
            continue
        }

        const merged: Change = { field: c.field }

        if (!prev.words && !c.words) {
            merged.from = prev.from
            merged.to = c.to
        }

        if (prev.words && c.words) {
            merged.words = { from: prev.words.from, to: c.words.to }
            merged.note = wordsNote(merged.words.from, merged.words.to)
        } else if (c.note) {
            merged.words = c.words
            merged.note = c.note
        }

        map.set(c.field, merged)
    }

    return [...map.values()].filter(
        (c) =>
            !(
                !c.words &&
                'from' in c &&
                'to' in c &&
                JSON.stringify(c.from) === JSON.stringify(c.to)
            ),
    )
}

type Entry = {
    action: Action
    userId?: string | number
    userEmail?: string
    targetCollection: string
    docId?: string | number
    docTitle: string
    changes: Change[]
}

async function writeLog(req: PayloadRequest, entry: Entry) {
    try {
        const changedFields = fieldsLabel(entry.changes)
        const actor = entry.userEmail ?? 'System'

        const summary =
            entry.action === 'login'
                ? `${actor} logged in`
                : `${actor} ${VERB[entry.action]} ${entry.targetCollection} "${entry.docTitle}"`

        if (entry.action === 'draft') {
            const since = new Date(Date.now() - MERGE_WINDOW_MS).toISOString()

            const existing = await req.payload.find({
                collection: AUDIT_SLUG as any,
                where: {
                    and: [
                        { action: { equals: 'draft' } },
                        { targetCollection: { equals: entry.targetCollection } },
                        { docId: { equals: String(entry.docId ?? '') } },
                        { userEmail: { equals: actor } },
                        { createdAt: { greater_than: since } },
                    ],
                },
                sort: '-createdAt',
                limit: 1,
                depth: 0,
                req,
                overrideAccess: true,
            })

            const last = existing.docs[0] as any

            if (last) {
                const merged = mergeChanges(last.changes as Change[], entry.changes)

                await req.payload.update({
                    collection: AUDIT_SLUG as any,
                    id: last.id,
                    data: {
                        changes: merged,
                        changedFields: fieldsLabel(merged),
                        docTitle: entry.docTitle,
                        summary,
                    } as any,
                    depth: 0,
                    req,
                    overrideAccess: true,
                })

                return
            }
        }

        await req.payload.create({
            collection: AUDIT_SLUG as any,
            data: {
                summary,
                action: entry.action,
                user: entry.userId,
                userEmail: actor,
                targetCollection: entry.targetCollection,
                docId: String(entry.docId ?? ''),
                docTitle: entry.docTitle,
                changedFields,
                changes: entry.changes,
            } as any,
            depth: 0,
            req,
            overrideAccess: true,
        })
    } catch (error) {
        req.payload.logger.error(
            `Activity Log write failed: ${error instanceof Error ? error.message : String(error)}`,
        )
    }
}

const auditAfterChange: CollectionAfterChangeHook = async ({
    collection,
    doc,
    previousDoc,
    operation,
    req,
}) => {
    if (collection.slug === AUDIT_SLUG) return doc
    if (!req.user && !LOG_SYSTEM_EVENTS) return doc

    if (req.query?.autosave === 'true') return doc

    const status = doc?._status

    const action: Action =
        operation === 'create'
            ? 'create'
            : status === 'published'
                ? 'publish'
                : status === 'draft'
                    ? 'draft'
                    : 'update'

    const changes =
        operation === 'create' ? [] : diffDocs(previousDoc, doc)

    if (changes.length === 0 && (action === 'update' || action === 'draft')) {
        return doc
    }

    await writeLog(req, {
        action,
        userId: req.user?.id,
        userEmail: req.user?.email as string | undefined,
        targetCollection: collection.slug,
        docId: doc?.id,
        docTitle: titleOf(doc),
        changes,
    })

    return doc
}

const auditBeforeDelete: CollectionBeforeDeleteHook = async ({
    collection,
    context,
    id,
    req,
}) => {
    if (collection.slug === AUDIT_SLUG) return

    try {
        const found = await req.payload.findByID({
            collection: collection.slug as any,
            id,
            depth: 0,
            draft: true,
            req,
            overrideAccess: true,
        })

        context.auditTitles = {
            ...((context.auditTitles as Record<string, string> | undefined) ?? {}),
            [`${collection.slug}:${id}`]: titleOf(found),
        }
    } catch {
        return
    }
}

const auditAfterDelete: CollectionAfterDeleteHook = async ({
    collection,
    context,
    doc,
    id,
    req,
}) => {
    if (collection.slug === AUDIT_SLUG) return doc
    if (!req.user && !LOG_SYSTEM_EVENTS) return doc

    const savedTitle = (
        context.auditTitles as Record<string, string> | undefined
    )?.[`${collection.slug}:${id}`]

    await writeLog(req, {
        action: 'delete',
        userId: req.user?.id,
        userEmail: req.user?.email as string | undefined,
        targetCollection: collection.slug,
        docId: doc?.id ?? id,
        docTitle: savedTitle || titleOf(doc) || String(id),
        changes: [],
    })

    return doc
}

const auditAfterLogin: CollectionAfterLoginHook = async ({ user, req }) => {
    await writeLog(req, {
        action: 'login',
        userId: user?.id,
        userEmail: user?.email as string | undefined,
        targetCollection: 'users',
        docId: user?.id,
        docTitle: String(user?.email ?? ''),
        changes: [],
    })

    return user
}

export const auditLogPlugin =
    (options: { collections: string[] }): Plugin =>
        (config) => ({
            ...config,
            collections: (config.collections ?? []).map((collection) => {
                if (!options.collections.includes(collection.slug)) {
                    return collection
                }

                return {
                    ...collection,
                    hooks: {
                        ...collection.hooks,
                        afterChange: [
                            ...(collection.hooks?.afterChange ?? []),
                            auditAfterChange,
                        ],
                        beforeDelete: [
                            ...(collection.hooks?.beforeDelete ?? []),
                            auditBeforeDelete,
                        ],
                        afterDelete: [
                            ...(collection.hooks?.afterDelete ?? []),
                            auditAfterDelete,
                        ],
                        ...(collection.slug === 'users'
                            ? {
                                afterLogin: [
                                    ...(collection.hooks?.afterLogin ?? []),
                                    auditAfterLogin,
                                ],
                            }
                            : {}),
                    },
                }
            }),
        })