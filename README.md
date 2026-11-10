# Wellnest Clinic Booking

Patient booking UI and API implemented to the Koya Cohort 4 Clinic Booking API contract.

## API contract

All API responses are JSON. Every API endpoint requires `X-API-Key`; a missing or incorrect key returns `401` with `{"error":"unauthorized"}`.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/reset` | Replace all slots and clear all bookings |
| `GET` | `/slots` | List every slot by earliest start; optional exact `provider` filter |
| `POST` | `/bookings` | Book a slot; optional `Idempotency-Key` |
| `GET` | `/bookings?email=...&limit=10&cursor=...` | List a person's bookings, oldest first, using cursor pagination |
| `GET` | `/bookings/:id` | Look up one booking |
| `DELETE` | `/bookings/:id` | Cancel a booking and release its slot |

Booking validation, time checks, atomic one-confirmed-booking-per-slot behavior, idempotency, cancellation, and per-email attempt limits are implemented in the API. `429` responses include the `Retry-After` header in whole seconds. API error response bodies use `{"error":"message"}`.

## Local development

Requires Node.js 22.18 or newer and a PostgreSQL database.

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to a PostgreSQL connection string, `API_KEY` to a long random key, and `VITE_API_KEY` to the same API key.
3. Keep `VITE_API_BASE_URL` empty for same-origin requests. For local Vite development, the configured proxy forwards requests to the API on port 3001.
4. Run `npm run dev:api` and `npm run dev` in separate terminals.
5. Open `/book` for the patient booking page or `/dashboard` for the clinic admin dashboard.

The browser sends `VITE_API_KEY` in requests, which makes that value visible to users. The assessment requires this header. Do not treat the browser key as a secret for protecting privileged data.

## Clinic dashboard

The admin dashboard reads the live slot schedule to show booked and available appointment counts, provider slot totals, and weekly booking counts. The Appointments view lists scheduled slots. Patients can be searched by email, their bookings paged, and confirmed bookings cancelled.

The assessment API does not provide a global booking-list endpoint, provider profiles, clinic preferences, booking completion outcomes, or a safe endpoint for adding/editing individual slots. The dashboard therefore does not invent patient details or expose `/reset` as a normal schedule editor; that endpoint deletes all bookings when replacing slots. Patient details are retrieved through the contract's email-filtered booking endpoint.

## Deploy on Render with managed PostgreSQL

The included [render.yaml](./render.yaml) deploys the Node API and built frontend together as one web service, so their URLs share an origin. Render creates the HTTPS base URL after deployment. Create a managed PostgreSQL database with a provider such as Neon, then:

1. Push this project to a GitHub repository and create a Render web service from it using the included Blueprint.
2. In Render's service environment, set `DATABASE_URL` to the PostgreSQL provider's connection string.
3. Set `API_KEY` to a long random value and set `VITE_API_KEY` to exactly the same value. The latter is embedded in the frontend build because the browser must send the contract-required header.
4. Trigger a deploy so Vite builds with `VITE_API_KEY`.
5. Use the deployed Render service's HTTPS origin as the assessment's **API base URL** and add `/book` to that origin for the **web page URL**. Enter the matching `API_KEY` as the **API key**.

If frontend and API are hosted on separate origins, set `VITE_API_BASE_URL` to the API's HTTPS origin at frontend build time and set `ALLOWED_ORIGIN` on the API to the frontend's HTTPS origin. Multiple allowed origins can be comma-separated. The frontend and API must both use HTTPS for the final submission.

Managed PostgreSQL connection and database must remain available for the assessment. Do not call `/reset` against a live assessment database except when the assessment checks require it; reset replaces all slots and deletes all bookings.

## Verify

```sh
npm run build
npm run test:api
npm run lint
```

API tests use an in-memory PostgreSQL emulator and do not require a live database. For deployment, configure `DATABASE_URL`, `API_KEY`, and `VITE_API_KEY` in the hosting service.
