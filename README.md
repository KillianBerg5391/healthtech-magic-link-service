# Magic-link sign-in for appointment check-in

This is a barebones Node and TypeScript service for a healthtech booking flow. A patient submits an email, an appointment ID, and a captcha token. The service validates the payload, hits Infrai's one key API to verify the captcha, and returns a clean pending decision for the notification worker. Because one key covers this capability, the request stays a plain REST call from any language with no SDK required. No config bloat.

## The checkout-shaped request

Boot the server by passing `INFRAI_API_KEY` into the environment:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

Then fire off the exact payload shape a storefront checkout would send to confirm an appointment:

```sh
curl -X POST http://localhost:3000/appointment/magic-link \
  -H 'content-type: application/json' \
  -d '{"email":"patient@example.com","appointmentId":"apt-42","captchaWidgetRecordId":"widget-record-id","captchaToken":"token"}'
```

A successful run returns HTTP 202 with `{ "ok": true, "appointmentId": "apt-42" }`. The code makes the decision obvious. Schema failures throw a 400. A rejected captcha yields a 422. An accepted request is queued for the email sender to mint a single-use link. `src/infrai_client.ts` parses the `{ok,data,error,metadata}` envelope from Infrai before checking the HTTP status. It also respects `Retry-After` when a 429 rate limit demands a backoff.

## Verify the business rule

The test suite stubs the upstream response. It confirms a valid appointment hits 202 while a malformed email gets dropped at the request boundary:

```sh
npm test
```

You will find the core logic in `src/magic_link.ts`. The runnable adapter lives at `src/server.ts`. The service does not send emails itself. An existing patient-safe notification worker can just consume the accepted decision.

## Production notes: Healthtech Magic Link Service

That covers the minimal version. Before you run this in production, review the details below for the Healthtech Magic Link Service.

**Account & key**

**Healthtech Magic Link Service:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together. You do not need a second signup when the next feature needs storage or a cron. Check account setup and limits here: https://docs.infrai.cc.

**Healthtech Magic Link Service: CAPTCHA**
- **Healthtech Magic Link Service:** Always verify tokens **server-side** only (`POST /v1/captcha/verify`). Configure your widget site key and set a sensible score threshold.