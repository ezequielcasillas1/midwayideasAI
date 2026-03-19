# Infrastructure — API keys & secrets checklist

**Sources:** `src/lib/supabase.ts`, `netlify.toml`, `remember.mdc`, and Cursor plan `midway_security_enhancements_e019aed0.plan.md` (MIDWAY Security Enhancements).

## Application (this repo today)

- [ ] **Supabase project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- [ ] **Supabase anon key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Local:** `.env.local`. **Netlify:** site env (same names).

## Supabase (dashboard / server)

- [ ] **Service role key** — server/admin only; never `NEXT_PUBLIC_*` or browser
- [ ] **Database password** — if using direct Postgres outside the client

## Security plan — app / CI env (from plan § Environment Variables)

- [ ] **`STRIPE_SECRET_KEY`** — server only (Connect, PaymentIntents, Identity sessions)
- [ ] **`STRIPE_PUBLISHABLE_KEY`** — use `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` if Stripe.js / Elements runs in the browser; otherwise keep server-only per your wiring
- [ ] **`STRIPE_WEBHOOK_SECRET`** — verify Stripe webhooks (payments + Identity results)
- [ ] **`PERSPECTIVE_API_KEY`** — Perspective API (Google Cloud)
- [ ] **`OPENAI_API_KEY`** — OpenAI Moderation API

## Twilio (plan § 7.1 — via Supabase Phone Auth)

Configured in **Supabase Dashboard** (Auth → Phone); not necessarily duplicated in app env:

- [ ] **Twilio Account SID**
- [ ] **Twilio Auth Token**
- [ ] **Twilio phone number** (SMS-capable)

## OAuth providers (plan § 1.3 — Supabase Auth)

Configured in **Supabase Dashboard** + provider consoles:

- [ ] **GitHub OAuth App** — Client ID + Client Secret → Supabase Auth (GitHub provider)
- [ ] **Google OAuth** — Client ID + Client Secret (Google Cloud Console) → Supabase Auth (Google provider)

## Third-party accounts to enable (plan § Third-Party Setup)

- [ ] **Stripe** — account; enable **Connect**; enable **Identity** in Dashboard
- [ ] **Twilio** — account; credentials + purchased number → Supabase
- [ ] **Perspective API** — enabled in **Google Cloud** project → API key → `PERSPECTIVE_API_KEY`
- [ ] **OpenAI** — API key → `OPENAI_API_KEY`

## Hosting & DNS (`remember.mdc`)

- [ ] **Netlify** — deploy access; optional personal access token for CLI/CI
- [ ] **Namecheap** — API only if automating DNS; confirm host ↔ DNS when ready

## Optional (not in plan env block)

- [ ] **hCaptcha / reCAPTCHA** — site key (public) + secret (server)
- [ ] **Sentry** — DSN (+ CI token if needed for source maps)
- [ ] **Transactional email** (Resend / SendGrid / etc.) — if beyond Supabase auth email

## Security reminder

- Only **Supabase URL + anon**, **Stripe publishable** (if client-side), and CAPTCHA **site** keys are public. Keep all other tokens server-side, Supabase provider secrets, or CI secrets only.
