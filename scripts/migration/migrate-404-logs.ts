import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'

// ============================================================
// ENV
// ============================================================

dotenv.config({
  path: '.env',
})

// ============================================================
// PAYLOAD CONFIG
// ============================================================

const { default: configPromise } = await import(
  '../../src/payload.config'
)

const config = await configPromise

// ============================================================
// TYPES
// ============================================================

// Actual Rank Math 404 export format:
//
// {
//   "url": "ingest",
//   "hits": 1,
//   "lastAccessed": "2026-09-25 20:21:12"
// }

type RankMath404Log = {
  url: string
  hits: number
  lastAccessed: string | null
}

// ============================================================
// CONFIG
// ============================================================

const LOGS_FILE = path.resolve(
  process.env.NOT_FOUND_LOGS_FILE ||
    './rankmath-404-logs.json',
)

// ============================================================
// NORMALIZE PATH
// ============================================================

function normalizePath(value: string): string {
  let pathValue = value.trim()

  if (!pathValue) {
    return ''
  }

  // If Rank Math somehow contains a full URL,
  // keep only pathname + query string.
  try {
    const url = new URL(pathValue)

    pathValue =
      url.pathname +
      url.search
  } catch {
    // Already a relative path.
  }

  // Rank Math stores paths without leading slash.
  if (!pathValue.startsWith('/')) {
    pathValue = `/${pathValue}`
  }

  return pathValue
}

// ============================================================
// LOAD JSON
// ============================================================

function loadLogs(): RankMath404Log[] {
  if (!fs.existsSync(LOGS_FILE)) {
    throw new Error(
      `404 log file not found: ${LOGS_FILE}`,
    )
  }

  const raw = fs.readFileSync(
    LOGS_FILE,
    'utf8',
  )

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(
      `Invalid JSON file: ${LOGS_FILE}`,
    )
  }

  // ----------------------------------------------------------
  // Expected format:
  //
  // {
  //   "success": true,
  //   "count": 27,
  //   "logs": [...]
  // }
  // ----------------------------------------------------------

  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'logs' in parsed
  ) {
    const data = parsed as {
      logs?: unknown
    }

    if (Array.isArray(data.logs)) {
      return data.logs as RankMath404Log[]
    }
  }

  // ----------------------------------------------------------
  // Also support direct array
  // ----------------------------------------------------------

  if (Array.isArray(parsed)) {
    return parsed as RankMath404Log[]
  }

  throw new Error(
    'Invalid Rank Math 404 log JSON structure.',
  )
}

// ============================================================
// FIND EXISTING LOG
// ============================================================

async function findExistingLog(
  payload: any,
  pathValue: string,
) {
  const result =
    await payload.find({
      collection: 'not-found-logs',

      where: {
        path: {
          equals: pathValue,
        },
      },

      limit: 1,
      depth: 0,
    })

  return result.docs[0] || null
}

// ============================================================
// MIGRATION
// ============================================================

async function migrate404Logs() {
  console.log('')

  console.log(
    '========================================',
  )

  console.log(
    ' Starting Rank Math 404 Log Migration',
  )

  console.log(
    '========================================',
  )

  console.log('')

  // ----------------------------------------------------------
  // LOAD PAYLOAD
  // ----------------------------------------------------------

  const payload =
    await getPayload({
      config,
    })

  // ----------------------------------------------------------
  // LOAD RANK MATH LOGS
  // ----------------------------------------------------------

  const logs =
    loadLogs()

  console.log(
    `404 logs file: ${LOGS_FILE}`,
  )

  console.log(
    `Found ${logs.length} Rank Math 404 logs`,
  )

  console.log('')

  let created = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  // ==========================================================
  // PROCESS LOGS
  // ==========================================================

  for (
    let index = 0;
    index < logs.length;
    index++
  ) {
    const log =
      logs[index]

    console.log(
      `[${index + 1}/${logs.length}] Rank Math URL: ${log.url}`,
    )

    try {
      // ------------------------------------------------------
      // VALIDATION
      // ------------------------------------------------------

      if (!log.url) {
        console.warn(
          '  ⚠ Missing URL. Skipping.',
        )

        skipped++
        continue
      }

      // ------------------------------------------------------
      // NORMALIZE PATH
      // ------------------------------------------------------

      const pathValue =
        normalizePath(
          log.url,
        )

      if (!pathValue) {
        console.warn(
          '  ⚠ Empty path after normalization. Skipping.',
        )

        skipped++
        continue
      }

      // ------------------------------------------------------
      // COUNT
      // ------------------------------------------------------

      const count =
        Number.isFinite(
          Number(log.hits),
        )
          ? Number(log.hits)
          : 1

      // ------------------------------------------------------
      // DATE
      // ------------------------------------------------------

      let lastSeenAt:
        | string
        | null = null

      if (log.lastAccessed) {
        const date =
          new Date(
            log.lastAccessed.replace(
              ' ',
              'T',
            ),
          )

        if (
          !Number.isNaN(
            date.getTime(),
          )
        ) {
          lastSeenAt =
            date.toISOString()
        }
      }

      // ------------------------------------------------------
      // PAYLOAD DATA
      // ------------------------------------------------------

      const data = {
        path: pathValue,

        // Rank Math export does not provide
        // referrer/user-agent in the current format.
        referrer: '',

        userAgent: '',

        // Rank Math 404 table does not contain IP.
        ip: '',

        count,

        lastSeenAt,
      }

      console.log(
        `  ↳ Path: ${pathValue}`,
      )

      console.log(
        `  ↳ Count: ${count}`,
      )

      if (lastSeenAt) {
        console.log(
          `  ↳ Last Seen: ${lastSeenAt}`,
        )
      }

      // ------------------------------------------------------
      // DUPLICATE CHECK
      // ------------------------------------------------------

      const existing =
        await findExistingLog(
          payload,
          pathValue,
        )

      // ------------------------------------------------------
      // UPDATE
      // ------------------------------------------------------

      if (existing) {
        await payload.update({
          collection:
            'not-found-logs',

          id: Number(
            existing.id,
          ),

          data,
        })

        updated++

        console.log(
          `  ↳ Updated Payload 404 Log ID: ${existing.id}`,
        )
      }

      // ------------------------------------------------------
      // CREATE
      // ------------------------------------------------------

      else {
        const createdLog =
          await payload.create({
            collection:
              'not-found-logs',

            data,
          })

        created++

        console.log(
          `  ↳ Created Payload 404 Log ID: ${createdLog.id}`,
        )
      }

      console.log('')
    } catch (error) {
      failed++

      console.error(
        `  ✗ Failed URL: ${log.url}`,
      )

      if (
        error instanceof Error
      ) {
        console.error(
          `  ${error.message}`,
        )

        if (error.stack) {
          console.error(
            error.stack,
          )
        }
      } else {
        console.dir(
          error,
          {
            depth: null,
          },
        )
      }

      console.log('')
    }
  }

  // ==========================================================
  // SUMMARY
  // ==========================================================

  console.log('')

  console.log(
    '========================================',
  )

  console.log(
    ' 404 Log Migration Completed',
  )

  console.log(
    '========================================',
  )

  console.log(
    `Rank Math 404 logs : ${logs.length}`,
  )

  console.log(
    `Created            : ${created}`,
  )

  console.log(
    `Updated            : ${updated}`,
  )

  console.log(
    `Skipped            : ${skipped}`,
  )

  console.log(
    `Failed             : ${failed}`,
  )

  console.log(
    '========================================',
  )

  console.log('')

  if (failed === 0) {
    console.log(
      '✓ 404 LOG MIGRATION FINISHED',
    )
  } else {
    console.log(
      '⚠ MIGRATION FINISHED WITH FAILURES',
    )
  }

  console.log('')
}

// ============================================================
// RUN
// ============================================================

migrate404Logs().catch(
  (error) => {
    console.error('')

    console.error(
      '========================================',
    )

    console.error(
      ' 404 Log Migration Failed',
    )

    console.error(
      '========================================',
    )

    console.error(error)

    console.error('')

    process.exit(1)
  },
)