import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express, { type NextFunction, type Request, type Response } from 'express'
import { Pool, type PoolClient } from 'pg'

type SlotInput = {
  id: string
  provider: string
  start: string
  end: string
}

type BookingInput = {
  slot_id: string
  name: string
  email: string
}

type Booking = {
  id: string
  slot_id: string
  name: string
  email: string
  status: 'confirmed' | 'cancelled'
  created_at: string
}

type BookingRow = Omit<Booking, 'created_at'> & { created_at: Date | string }

type ApiResult = {
  status: number
  body: Record<string, unknown> | Booking
}

type AppOptions = {
  apiKey: string
  allowedOrigins?: string[]
  staticDirectory?: string
}

const schema = `
  CREATE TABLE IF NOT EXISTS slots (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    start TIMESTAMPTZ NOT NULL,
    "end" TIMESTAMPTZ NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    slot_id TEXT NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS one_confirmed_booking_per_slot
    ON bookings(slot_id) WHERE status = 'confirmed';
  CREATE INDEX IF NOT EXISTS bookings_by_email_created
    ON bookings(email, created_at, id);

  CREATE TABLE IF NOT EXISTS booking_attempt_locks (
    email TEXT PRIMARY KEY
  );
  CREATE TABLE IF NOT EXISTS booking_attempts (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL
  );
  CREATE INDEX IF NOT EXISTS booking_attempts_by_email_time
    ON booking_attempts(email, attempted_at);

  CREATE TABLE IF NOT EXISTS idempotency_locks (
    key TEXT PRIMARY KEY
  );
  CREATE TABLE IF NOT EXISTS idempotency_keys (
    key TEXT PRIMARY KEY,
    request_body TEXT NOT NULL,
    response_status INTEGER NOT NULL,
    response_body JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
  );
`

export async function initializeDatabase(pool: Pool): Promise<void> {
  await pool.query(schema)
}

async function transaction<T>(pool: Pool, action: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await action(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function canonicalJson(value: unknown): string {
  if (value === undefined) return 'null'
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (isRecord(value)) {
    const entries = Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value)
}

function errorResult(status: number, message: string): ApiResult {
  return { status, body: { error: message } }
}

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validDateTime(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && Number.isFinite(Date.parse(value))
}

function normalizeBooking(row: BookingRow): Booking {
  return {
    ...row,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
  }
}

function isUniqueViolation(error: unknown): boolean {
  return isRecord(error) && error.code === '23505'
}

function hasRetryAfter(value: unknown): value is Record<string, unknown> & { retry_after: number } {
  return isRecord(value) && typeof value.retry_after === 'number'
}

export function createApp(pool: Pool, options: AppOptions) {
  const app = express()
  app.disable('x-powered-by')

  app.use((request, response, next) => {
    const origin = request.get('Origin')
    if (origin && options.allowedOrigins?.includes(origin)) {
      response.setHeader('Access-Control-Allow-Origin', origin)
      response.setHeader('Vary', 'Origin')
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Idempotency-Key')
      response.setHeader('Access-Control-Expose-Headers', 'Retry-After')
    }
    if (request.method === 'OPTIONS') {
      response.sendStatus(origin && options.allowedOrigins?.includes(origin) ? 204 : 403)
      return
    }
    next()
  })

  function authenticate(request: Request, response: Response, next: NextFunction) {
    if (request.get('X-API-Key') !== options.apiKey) {
      response.status(401).json({ error: 'unauthorized' })
      return
    }
    next()
  }

  app.use(['/reset', '/slots', '/bookings'], authenticate)
  app.use(express.json({ limit: '32kb' }))

  app.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
    if (error instanceof SyntaxError && 'body' in error) {
      response.status(400).json({ error: 'invalid JSON body' })
      return
    }
    next(error)
  })

  app.post('/reset', async (request, response, next) => {
    const body: unknown = request.body
    if (!isRecord(body) || !Array.isArray(body.slots)) {
      response.status(400).json({ error: 'invalid request body' })
      return
    }

    const slots: SlotInput[] = []
    const ids = new Set<string>()
    for (const candidate of body.slots) {
      if (!isRecord(candidate)) {
        response.status(400).json({ error: 'invalid slot' })
        return
      }

      const { id, provider, start, end } = candidate
      if (
        typeof id !== 'string' || id.trim() === ''
        || typeof provider !== 'string' || provider.trim() === ''
        || typeof start !== 'string' || !validDateTime(start)
        || typeof end !== 'string' || !validDateTime(end)
        || Date.parse(end) <= Date.parse(start)
        || ids.has(id)
      ) {
        response.status(400).json({ error: 'invalid slot' })
        return
      }
      ids.add(id)
      slots.push({ id, provider, start, end })
    }

    try {
      await transaction(pool, async (client) => {
        await client.query('DELETE FROM bookings')
        await client.query('DELETE FROM slots')
        await client.query('DELETE FROM idempotency_keys')
        await client.query('DELETE FROM idempotency_locks')
        await client.query('DELETE FROM booking_attempts')
        await client.query('DELETE FROM booking_attempt_locks')
        for (const slot of slots) {
          await client.query(
            'INSERT INTO slots (id, provider, start, "end") VALUES ($1, $2, $3, $4)',
            [slot.id, slot.provider, slot.start, slot.end],
          )
        }
      })
      response.status(200).json({})
    } catch (error) {
      next(error)
    }
  })

  app.get('/slots', async (request, response, next) => {
    const provider = request.query.provider
    if (provider !== undefined && typeof provider !== 'string') {
      response.status(400).json({ error: 'invalid provider' })
      return
    }

    try {
      const result = await pool.query<Omit<SlotInput, 'start' | 'end'> & { start: Date | string; end: Date | string; available: boolean }>(`
        SELECT s.id, s.provider, s.start, s."end",
          b.id IS NULL AS available
        FROM slots s
        LEFT JOIN bookings b ON b.slot_id = s.id AND b.status = 'confirmed'
        ${provider === undefined ? '' : 'WHERE s.provider = $1'}
        ORDER BY s.start ASC, s.id ASC
      `, provider === undefined ? [] : [provider])
      response.json({
        slots: result.rows.map((slot) => ({
          ...slot,
          start: slot.start instanceof Date ? slot.start.toISOString() : new Date(slot.start).toISOString(),
          end: slot.end instanceof Date ? slot.end.toISOString() : new Date(slot.end).toISOString(),
        })),
      })
    } catch (error) {
      next(error)
    }
  })

  app.post('/bookings', async (request, response, next) => {
    const body: unknown = request.body
    const idempotencyKey = request.get('Idempotency-Key')
    const requestBody = canonicalJson(body)

    try {
      const result = await transaction(pool, async (client): Promise<ApiResult> => {
        if (idempotencyKey !== undefined) {
          await client.query(
            'INSERT INTO idempotency_locks (key) VALUES ($1) ON CONFLICT (key) DO NOTHING',
            [idempotencyKey],
          )
          await client.query('SELECT key FROM idempotency_locks WHERE key = $1 FOR UPDATE', [idempotencyKey])
          const saved = await client.query<{ request_body: string; response_status: number; response_body: Booking | Record<string, unknown> }>(
            'SELECT request_body, response_status, response_body FROM idempotency_keys WHERE key = $1',
            [idempotencyKey],
          )
          if (saved.rows[0]) {
            if (saved.rows[0].request_body !== requestBody) {
              return errorResult(422, 'idempotency key reused with a different body')
            }
            return { status: saved.rows[0].response_status, body: saved.rows[0].response_body }
          }
        }

        const candidateEmail = isRecord(body) && typeof body.email === 'string'
          ? body.email.trim().toLowerCase()
          : ''
        const now = new Date()
        const cutoff = new Date(now.getTime() - 60_000)
        await client.query(
          'INSERT INTO booking_attempt_locks (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
          [candidateEmail],
        )
        await client.query('SELECT email FROM booking_attempt_locks WHERE email = $1 FOR UPDATE', [candidateEmail])
        await client.query('DELETE FROM booking_attempts WHERE email = $1 AND attempted_at <= $2', [candidateEmail, cutoff])
        const recentAttempts = await client.query<{ attempted_at: Date }>(
          'SELECT attempted_at FROM booking_attempts WHERE email = $1 AND attempted_at > $2 ORDER BY attempted_at ASC',
          [candidateEmail, cutoff],
        )
        await client.query('INSERT INTO booking_attempts (email, attempted_at) VALUES ($1, $2)', [candidateEmail, now])

        let result: ApiResult
        if ((recentAttempts.rowCount ?? 0) >= 5) {
          const oldestValue = recentAttempts.rows[0].attempted_at
          const oldest = oldestValue instanceof Date ? oldestValue.getTime() : new Date(oldestValue).getTime()
          const retryAfter = Math.max(1, Math.ceil((oldest + 60_000 - now.getTime()) / 1000))
          result = { status: 429, body: { error: 'too many booking attempts for this email', retry_after: retryAfter } }
        } else if (
          !isRecord(body)
          || typeof body.slot_id !== 'string' || body.slot_id.trim() === ''
          || typeof body.name !== 'string' || body.name.trim() === ''
          || typeof body.email !== 'string' || body.email.trim() === ''
        ) {
          result = errorResult(400, 'slot_id, name and email are required')
        } else {
          const input: BookingInput = {
            slot_id: body.slot_id.trim(),
            name: body.name.trim(),
            email: body.email.trim().toLowerCase(),
          }
          if (!validEmail(input.email)) {
            result = errorResult(400, 'email is invalid')
          } else {
            const slotResult = await client.query<{ id: string; start: Date }>(
              'SELECT id, start FROM slots WHERE id = $1 FOR UPDATE',
              [input.slot_id],
            )
            const slot = slotResult.rows[0]
            if (!slot) {
              result = errorResult(404, 'slot not found')
            } else if (slot.start.getTime() <= now.getTime()) {
              result = errorResult(400, 'slot has already started')
            } else {
              const existing = await client.query(
                "SELECT 1 FROM bookings WHERE slot_id = $1 AND status = 'confirmed'",
                [input.slot_id],
              )
              if ((existing.rowCount ?? 0) > 0) {
                result = errorResult(409, 'slot already booked')
              } else {
                const booking: Booking = {
                  id: randomUUID(),
                  slot_id: input.slot_id,
                  name: input.name,
                  email: input.email,
                  status: 'confirmed',
                  created_at: now.toISOString(),
                }
                await client.query(`
                  INSERT INTO bookings (id, slot_id, name, email, status, created_at)
                  VALUES ($1, $2, $3, $4, $5, $6)
                `, [booking.id, booking.slot_id, booking.name, booking.email, booking.status, booking.created_at])
                result = { status: 201, body: booking }
              }
            }
          }
        }

        if (idempotencyKey !== undefined) {
          await client.query(`
            INSERT INTO idempotency_keys (key, request_body, response_status, response_body, created_at)
            VALUES ($1, $2, $3, $4, $5)
          `, [idempotencyKey, requestBody, result.status, JSON.stringify(result.body), now])
        }
        return result
      })

      if (result.status === 429 && hasRetryAfter(result.body)) {
        response.setHeader('Retry-After', String(result.body.retry_after))
        const { retry_after: _retryAfter, ...bodyWithoutRetryAfter } = result.body
        response.status(result.status).json(bodyWithoutRetryAfter)
        return
      }
      response.status(result.status).json(result.body)
    } catch (error) {
      if (isUniqueViolation(error)) {
        response.status(409).json({ error: 'slot already booked' })
        return
      }
      next(error)
    }
  })

  app.get('/bookings', async (request, response, next) => {
    const emailQuery = request.query.email
    if (typeof emailQuery !== 'string' || emailQuery.trim() === '') {
      response.status(400).json({ error: 'email is required' })
      return
    }

    const limitQuery = request.query.limit
    const limit = limitQuery === undefined ? 10 : Number(limitQuery)
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      response.status(400).json({ error: 'invalid limit' })
      return
    }

    const email = emailQuery.trim().toLowerCase()
    const cursor = request.query.cursor
    let after: { created_at: Date; id: string } | undefined
    if (cursor !== undefined) {
      if (typeof cursor !== 'string') {
        response.status(400).json({ error: 'invalid cursor' })
        return
      }
      try {
        const decoded: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
        if (!isRecord(decoded) || typeof decoded.id !== 'string') {
          response.status(400).json({ error: 'invalid cursor' })
          return
        }
        const cursorResult = await pool.query<{ created_at: Date; id: string }>(
          'SELECT created_at, id FROM bookings WHERE id = $1 AND lower(email) = $2',
          [decoded.id, email],
        )
        after = cursorResult.rows[0]
        if (!after) {
          response.status(400).json({ error: 'invalid cursor' })
          return
        }
      } catch {
        response.status(400).json({ error: 'invalid cursor' })
        return
      }
    }

    try {
      const result = after
        ? await pool.query<BookingRow>(`
          SELECT id, slot_id, name, email, status, created_at
          FROM bookings
          WHERE lower(email) = $1 AND (created_at > $2 OR (created_at = $2 AND id > $3))
          ORDER BY created_at ASC, id ASC
          LIMIT $4
        `, [email, after.created_at, after.id, limit + 1])
        : await pool.query<BookingRow>(`
          SELECT id, slot_id, name, email, status, created_at
          FROM bookings
          WHERE lower(email) = $1
          ORDER BY created_at ASC, id ASC
          LIMIT $2
        `, [email, limit + 1])
      const hasMore = result.rows.length > limit
      const bookings = (hasMore ? result.rows.slice(0, limit) : result.rows).map(normalizeBooking)
      const last = bookings.at(-1)
      const nextCursor = hasMore && last
        ? Buffer.from(JSON.stringify({ id: last.id })).toString('base64url')
        : null
      response.json({ bookings, next_cursor: nextCursor })
    } catch (error) {
      next(error)
    }
  })

  app.get('/bookings/:id', async (request, response, next) => {
    try {
      const result = await pool.query<BookingRow>(`
        SELECT id, slot_id, name, email, status, created_at
        FROM bookings WHERE id = $1
      `, [request.params.id])
      if (!result.rows[0]) {
        response.status(404).json({ error: 'booking not found' })
        return
      }
      response.json(normalizeBooking(result.rows[0]))
    } catch (error) {
      next(error)
    }
  })

  app.delete('/bookings/:id', async (request, response, next) => {
    try {
      const result = await transaction(pool, async (client) => {
        const found = await client.query<BookingRow>(`
          SELECT id, slot_id, name, email, status, created_at
          FROM bookings WHERE id = $1 FOR UPDATE
        `, [request.params.id])
        const booking = found.rows[0]
        if (!booking) return { status: 404 as const, body: { error: 'booking not found' } }
        if (booking.status === 'cancelled') return { status: 409 as const, body: { error: 'booking is already cancelled' } }
        await client.query("UPDATE bookings SET status = 'cancelled' WHERE id = $1", [booking.id])
        return { status: 200 as const, body: { ...normalizeBooking(booking), status: 'cancelled' } }
      })
      response.status(result.status).json(result.body)
    } catch (error) {
      next(error)
    }
  })

  app.use(['/reset', '/slots', '/bookings'], (_request, response) => {
    response.status(404).json({ error: 'not found' })
  })

  const staticDirectory = options.staticDirectory ?? path.resolve('dist')
  app.use(express.static(staticDirectory))
  app.use((request, response, next) => {
    if (request.method !== 'GET' || request.path.startsWith('/api/')) {
      next()
      return
    }
    response.sendFile(path.join(staticDirectory, 'index.html'), (error) => {
      if (error) next()
    })
  })

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    console.error('Unhandled API error:', error)
    response.status(500).json({ error: 'internal server error' })
  })

  return app
}

async function startServer() {
  const apiKey = process.env.API_KEY
  const connectionString = process.env.DATABASE_URL
  if (!apiKey) throw new Error('API_KEY must be configured before starting the API.')
  if (!connectionString) throw new Error('DATABASE_URL must be configured before starting the API.')

  const pool = new Pool({ connectionString })
  await initializeDatabase(pool)
  const allowedOrigins = (process.env.ALLOWED_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  const app = createApp(pool, { apiKey, allowedOrigins })
  const port = Number(process.env.PORT ?? 3001)
  app.listen(port, () => {
    console.log(`Clinic booking API listening on port ${port}`)
  })
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  startServer().catch((error: unknown) => {
    console.error('Failed to start clinic booking API:', error)
    process.exitCode = 1
  })
}
