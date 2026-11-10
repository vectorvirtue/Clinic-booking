import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { newDb } from 'pg-mem'
import { createApp, initializeDatabase } from './index.ts'

const memoryDatabase = newDb()
const { Pool: MemoryPool } = memoryDatabase.adapters.createPg()
const pool = new MemoryPool()
await initializeDatabase(pool)
const app = createApp(pool, { apiKey: 'test-api-key' })
const server = app.listen(0)
await new Promise<void>((resolve) => server.once('listening', resolve))
const address = server.address()
assert.ok(address && typeof address !== 'string')
const baseUrl = `http://127.0.0.1:${address.port}`

before(async () => {
  await reset()
})

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })
  await pool.end()
})

function headers(extra: Record<string, string> = {}) {
  return { 'X-API-Key': 'test-api-key', 'Content-Type': 'application/json', ...extra }
}

async function reset(slots?: Array<{ id: string; provider: string; start: string; end: string }>) {
  const future = new Date(Date.now() + 86_400_000)
  future.setUTCHours(9, 0, 0, 0)
  const defaultSlots = [
    { id: 's1', provider: 'Dr Ade', start: future.toISOString(), end: new Date(future.getTime() + 30 * 60_000).toISOString() },
    { id: 's2', provider: 'Dr Chidi', start: new Date(future.getTime() + 60 * 60_000).toISOString(), end: new Date(future.getTime() + 90 * 60_000).toISOString() },
  ]
  const response = await fetch(`${baseUrl}/reset`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ slots: slots ?? defaultSlots }),
  })
  assert.equal(response.status, 200)
}

async function createBooking(
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {},
) {
  return fetch(`${baseUrl}/bookings`, {
    method: 'POST',
    headers: headers(extraHeaders),
    body: JSON.stringify(body),
  })
}

test('requires a valid API key for every endpoint', async () => {
  const missingKey = await fetch(`${baseUrl}/slots`)
  assert.equal(missingKey.status, 401)
  assert.deepEqual(await missingKey.json(), { error: 'unauthorized' })

  const wrongKey = await fetch(`${baseUrl}/slots`, { headers: { 'X-API-Key': 'wrong' } })
  assert.equal(wrongKey.status, 401)

  const malformedWithoutKey = await fetch(`${baseUrl}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  })
  assert.equal(malformedWithoutKey.status, 401)
})

test('lists slots in chronological order with exact provider filtering', async () => {
  await reset([
    { id: 'later', provider: 'Dr Ade', start: '2027-01-02T10:00:00Z', end: '2027-01-02T10:30:00Z' },
    { id: 'earlier', provider: 'Dr Ade', start: '2027-01-02T09:00:00Z', end: '2027-01-02T09:30:00Z' },
    { id: 'other', provider: 'Dr Chidi', start: '2027-01-02T09:15:00Z', end: '2027-01-02T09:45:00Z' },
  ])
  const allResponse = await fetch(`${baseUrl}/slots`, { headers: headers() })
  const all = await allResponse.json() as { slots: Array<{ id: string; available: boolean; start: string; end: string }> }
  assert.deepEqual(all.slots.map((slot) => slot.id), ['earlier', 'other', 'later'])
  assert.ok(all.slots.every((slot) => slot.available))
  assert.match(all.slots[0].start, /^\d{4}-\d{2}-\d{2}T/)
  assert.match(all.slots[0].end, /^\d{4}-\d{2}-\d{2}T/)

  const filteredResponse = await fetch(`${baseUrl}/slots?provider=Dr%20Ade`, { headers: headers() })
  const filtered = await filteredResponse.json() as { slots: Array<{ id: string }> }
  assert.deepEqual(filtered.slots.map((slot) => slot.id), ['earlier', 'later'])
})

test('validates booking details, normalizes name and email, and looks up a booking', async () => {
  await reset()
  const missing = await createBooking({ slot_id: '', name: ' ', email: '' })
  assert.equal(missing.status, 400)

  const invalidEmail = await createBooking({ slot_id: 's1', name: 'Ada', email: 'not-an-email' })
  assert.equal(invalidEmail.status, 400)

  const notFound = await createBooking({ slot_id: 'missing', name: 'Ada', email: 'ada@example.com' })
  assert.equal(notFound.status, 404)

  const response = await createBooking({ slot_id: 's1', name: '  Ada Obi  ', email: ' ADA@EXAMPLE.COM ' })
  assert.equal(response.status, 201)
  const booking = await response.json() as { id: string; slot_id: string; name: string; email: string; status: string; created_at: string }
  assert.equal(booking.name, 'Ada Obi')
  assert.equal(booking.email, 'ada@example.com')
  assert.equal(booking.status, 'confirmed')
  assert.equal(booking.slot_id, 's1')
  assert.ok(Number.isFinite(Date.parse(booking.created_at)))

  const lookup = await fetch(`${baseUrl}/bookings/${booking.id}`, { headers: headers() })
  assert.equal(lookup.status, 200)
  assert.equal((await lookup.json() as { id: string }).id, booking.id)
})

test('prevents double booking and cancellation frees the slot', async () => {
  await reset()
  const body = { slot_id: 's1', name: 'Ada', email: 'ada@example.com' }
  const first = await createBooking(body)
  assert.equal(first.status, 201)
  const booking = await first.json() as { id: string }

  const second = await createBooking({ ...body, email: 'other@example.com' })
  assert.equal(second.status, 409)

  const cancellation = await fetch(`${baseUrl}/bookings/${booking.id}`, { method: 'DELETE', headers: headers() })
  assert.equal(cancellation.status, 200)
  assert.equal((await cancellation.json() as { status: string }).status, 'cancelled')

  const secondCancellation = await fetch(`${baseUrl}/bookings/${booking.id}`, { method: 'DELETE', headers: headers() })
  assert.equal(secondCancellation.status, 409)

  const nextBooking = await createBooking({ ...body, email: 'other@example.com' })
  assert.equal(nextBooking.status, 201)
})

test('rejects bookings for slots that have already started', async () => {
  await reset([{
    id: 'past',
    provider: 'Dr Ade',
    start: '2020-01-01T09:00:00Z',
    end: '2020-01-01T09:30:00Z',
  }])
  const response = await createBooking({ slot_id: 'past', name: 'Ada', email: 'ada@example.com' })
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'slot has already started' })
})

test('allows only one booking when requests race for the same slot', async () => {
  await reset()
  const responses = await Promise.all(Array.from({ length: 10 }, (_, index) => createBooking({
    slot_id: 's1',
    name: `Patient ${index}`,
    email: `patient${index}@example.com`,
  })))
  const statuses = responses.map((response) => response.status)
  assert.equal(statuses.filter((status) => status === 201).length, 1)
  assert.equal(statuses.filter((status) => status === 409).length, 9)

  const slotsResponse = await fetch(`${baseUrl}/slots`, { headers: headers() })
  const slots = await slotsResponse.json() as { slots: Array<{ id: string; available: boolean }> }
  assert.equal(slots.slots.find((slot) => slot.id === 's1')?.available, false)
})

test('replays idempotent requests and rejects key reuse with another body', async () => {
  await reset()
  const body = { slot_id: 's1', name: 'Ada', email: 'ada@example.com' }
  const first = await createBooking(body, { 'Idempotency-Key': 'request-1' })
  const firstBody = await first.json()
  const replay = await createBooking(body, { 'Idempotency-Key': 'request-1' })
  assert.equal(replay.status, first.status)
  assert.deepEqual(await replay.json(), firstBody)

  const conflict = await createBooking({ ...body, name: 'Different name' }, { 'Idempotency-Key': 'request-1' })
  assert.equal(conflict.status, 422)
})

test('paginates a person’s bookings by email without case sensitivity', async () => {
  await reset()
  const one = await createBooking({ slot_id: 's1', name: 'Ada', email: 'ada@example.com' })
  assert.equal(one.status, 201)
  const two = await createBooking({ slot_id: 's2', name: 'Ada', email: 'ada@example.com' })
  assert.equal(two.status, 201)

  const firstPageResponse = await fetch(`${baseUrl}/bookings?email=ADA%40EXAMPLE.COM&limit=1`, { headers: headers() })
  assert.equal(firstPageResponse.status, 200)
  const firstPage = await firstPageResponse.json() as { bookings: Array<{ slot_id: string }>; next_cursor: string | null }
  assert.equal(firstPage.bookings.length, 1)
  assert.equal(firstPage.bookings[0].slot_id, 's1')
  assert.ok(firstPage.next_cursor)

  const secondPageResponse = await fetch(`${baseUrl}/bookings?email=ada%40example.com&limit=1&cursor=${firstPage.next_cursor}`, { headers: headers() })
  const secondPage = await secondPageResponse.json() as { bookings: Array<{ slot_id: string }>; next_cursor: string | null }
  assert.equal(secondPage.bookings[0].slot_id, 's2')
  assert.equal(secondPage.next_cursor, null)

  const invalidLimit = await fetch(`${baseUrl}/bookings?email=ada%40example.com&limit=51`, { headers: headers() })
  assert.equal(invalidLimit.status, 400)
})

test('rate limits the sixth attempt for one email and returns Retry-After', async () => {
  await reset()
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await createBooking({ slot_id: 'missing', name: 'Ada', email: 'ada@example.com' })
    assert.equal(response.status, 404)
  }
  const limited = await createBooking({ slot_id: 'missing', name: 'Ada', email: 'ada@example.com' })
  assert.equal(limited.status, 429)
  assert.match(limited.headers.get('Retry-After') ?? '', /^\d+$/)

  const otherEmail = await createBooking({ slot_id: 'missing', name: 'Bea', email: 'bea@example.com' })
  assert.equal(otherEmail.status, 404)
})
