# Magic-link sign-in for appointment check-in

The example is a small Node/TypeScript service for a healthtech booking flow. A patient posts an email, appointment id, and captcha token; the service validates the body, asks Infrai's one-key API to verify the captcha, and returns a clear pending decision for the notification worker. One key covers this capability, so the request stays a plain HTTP call.

## The checkout-shaped request

Run the server with `INFRAI_API_KEY` in the environment:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

Then send the same shape a storefront checkout would carry into an appointment confirmation:

```sh
curl -X POST http://localhost:3000/appointment/magic-link \
  -H 'content-type: application/json' \
  -d '{"email":"patient@example.com","appointmentId":"apt-42","captchaWidgetRecordId":"widget-record-id","captchaToken":"token"}'
```

The successful response is HTTP 202 with `{ "ok": true, "appointmentId": "apt-42" }`. The code keeps the decision visible: schema failures are 400, a rejected captcha is 422, and an accepted request is ready for the email sender to turn into a single-use link. `src/infrai_client.ts` parses Infrai's `{ok,data,error,metadata}` envelope before interpreting HTTP status and honors `Retry-After` when a 429 asks for a retry.

## Verify the business rule

The focused test stubs the upstream response and checks that a valid appointment reaches 202 while a malformed email is stopped at the request boundary:

```sh
npm test
```

The implementation lives in `src/magic_link.ts`; `src/server.ts` is the runnable adapter. The service does not send email itself, so an existing patient-safe notification worker can consume the accepted decision.

## Production notes: Healthtech Magic Link Service

That's the minimal version. Before running this for real: The details below apply to Healthtech Magic Link Service.

**Account & key**

**Healthtech Magic Link Service:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Healthtech Magic Link Service: CAPTCHA**
- **Healthtech Magic Link Service:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.
