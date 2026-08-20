# Inboxly — AI Email Generator

Describe the email you need to write, pick a tone and a length, and get a
send-ready subject line and message. Built as a 48-hour MVP test assignment.

- **Live demo:** https://vibe-coding-two-bice.vercel.app
- **Repository:** https://github.com/OlegZhdanenko/vibe-coding

Running on Gemini's free tier, so generation costs nothing to try. Create an
account with any email — confirmation is disabled on the demo project — and the
free plan gives you ten drafts.

---

## Contents

- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [Available scripts](#available-scripts)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Architecture and decisions](#architecture-and-decisions)
- [Docker](#docker)
- [Deployment](#deployment)
- [Testing](#testing)
- [What is not built](#what-is-not-built)

---

## Quick start

Requirements: **Node 24+** and npm.

```bash
git clone https://github.com/OlegZhdanenko/vibe-coding.git
cd vibe-coding
npm install
cp .env.example .env.local   # fill in the values, see below
npm run dev                  # http://localhost:5173
```

The app runs without any configuration, but with reduced capability:

| Configuration | What works |
|---|---|
| Nothing set | Landing, pricing, 404, theming. Sign-in shows a "not configured" notice. |
| Supabase only | Accounts, dashboard, history. Generation falls back to the offline writer. |
| Supabase + `GEMINI_API_KEY` | Everything, with real drafts. Google's free tier needs no card. |
| Supabase + `ANTHROPIC_API_KEY` | Everything, with real drafts from Claude. |

Gemini is the default when both keys are present, because it is the backend the
live demo runs on. `EMAIL_PROVIDER=anthropic` overrides that.

To try generation locally without any accounts:

```bash
EMAIL_PROVIDER=mock ALLOW_ANONYMOUS_GENERATION=true npm run dev
```

`npm run dev` serves the API from the same port as the client, so no second
process and no `vercel dev` are needed.

---

## Environment variables

Copy `.env.example` to `.env.local`. Anything prefixed `VITE_` is compiled into
the browser bundle and must be public; everything else stays server-side.

| Variable | Where | Required | Purpose |
|---|---|---|---|
| `VITE_SUPABASE_URL` | client | for accounts | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | client | for accounts | Public anon key; RLS is what protects data |
| `VITE_APP_NAME` | client | no | Product name in the UI (default `Inboxly`) |
| `VITE_API_BASE_URL` | client | no | Defaults to same-origin `/api` |
| `GEMINI_API_KEY` | server | one of the two | Gemini, `gemini-3.6-flash` — the default backend; free tier, no card |
| `ANTHROPIC_API_KEY` | server | one of the two | Claude, `claude-opus-5` — used when no Gemini key is set, or when pinned |
| `SUPABASE_URL` | server | for accounts | Usually the same as `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | server | recommended | Lets the quota counter bypass RLS so users cannot reset their own usage |
| `EMAIL_PROVIDER` | server | no | `gemini`, `anthropic` or `mock`. Omitted, the first available key wins: Gemini, then Claude, then the offline writer |
| `ALLOW_ANONYMOUS_GENERATION` | server | no | `true` allows unauthenticated generation — local development only |

---

## Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. **Project Settings → API**: copy the URL and the `anon` key into `.env.local`,
   and the `service_role` key into the server variables.
3. **SQL Editor**: run the migrations in order —
   [`0001_init.sql`](supabase/migrations/0001_init.sql) then
   [`0002_lock_quota_column.sql`](supabase/migrations/0002_lock_quota_column.sql).
   Both are idempotent, so re-running is safe.
4. **Authentication → Providers → Email**: for a smoother demo, turn off
   "Confirm email". With it on, sign-up shows a "check your inbox" screen
   instead of signing straight in — both paths are handled.

The migration creates:

- `profiles` — one row per user, holding the plan and the usage counter, created
  automatically by a trigger on `auth.users`.
- `emails` — generation history.
- Row level security on both, so a row is only ever readable by its owner.
- `increment_generations_used()` — a `security definer` function used by the
  endpoint to bump the quota counter atomically.
- Column privileges that keep `generations_used` out of reach of the
  `authenticated` role — see the note on quotas below.

---

## Available scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server, with `/api/generate` mounted as middleware |
| `npm run build` | Typechecks the whole repo, then builds the client |
| `npm run build:server` | Bundles the Node server for self-hosting |
| `npm start` | Runs the bundled server (expects `dist/` and `dist-server/`) |
| `npm run preview` | Serves the built client (no API) |
| `npm run lint` | ESLint across app, server and config |
| `npm run typecheck` | `tsc -b` across all three TS projects |
| `npm test` | Vitest, once |
| `npm run test:watch` | Vitest, watching |
| `npm run test:coverage` | Vitest with V8 coverage |

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Build | Vite 8 | Fast dev server, and its middleware hook lets the API run in-process |
| UI | React 19 + TypeScript | Required by the brief; TS strict throughout |
| Routing | React Router 7 | `errorElement` per route is the backbone of the error handling |
| Styling | Tailwind CSS 4 | Token-driven theming via CSS variables, no config file needed |
| Components | shadcn/ui | Accessible Radix primitives, owned in-repo rather than a black-box dependency |
| Animation | Framer Motion | Scroll reveals and result transitions |
| Forms | React Hook Form + Zod | One schema validates the form and the endpoint |
| Auth + data | Supabase | Auth, Postgres and row level security in one free tier |
| AI | Gemini `gemini-3.6-flash` (default), Claude `claude-opus-5` | Three implementations of one interface; streaming in all cases |
| Tests | Vitest + Testing Library | Same transform pipeline as the app |
| Hosting | Vercel Function + Docker | Two deployment targets from one handler |

---

## Project structure

```
.
├── api/
│   └── generate.ts              # Vercel adapter (a few lines, no logic)
├── server/
│   ├── generate-handler.ts      # The endpoint: validation, auth, quota, streaming
│   ├── http-adapter.ts          # Node ↔ Web Request/Response bridge, shared by all hosts
│   ├── node-server.ts           # Self-hosted host for the same handler (Docker)
│   ├── vite-dev-api.ts          # Dev-server host for the same handler
│   └── providers/               # The AI seam
│       ├── types.ts             #   EmailProvider interface
│       ├── anthropic.ts         #   Claude implementation
│       ├── gemini.ts            #   Gemini implementation
│       ├── mock.ts              #   Offline implementation
│       └── index.ts             #   resolveProvider()
├── src/
│   ├── app/                     # Router and root layout (providers live here)
│   ├── components/
│   │   ├── ui/                  # shadcn primitives
│   │   ├── common/              # Error states, section primitives, logo, loader
│   │   └── layout/              # Public, app and auth shells
│   ├── features/                # Vertical slices
│   │   ├── auth/                #   provider, guards, forms, error mapping
│   │   ├── generator/           #   form, result, history, hooks
│   │   ├── billing/             #   upgrade flow
│   │   └── marketing/           #   landing content and hero preview
│   ├── lib/
│   │   ├── errors.ts            # AppError vocabulary shared by client and server
│   │   ├── generation/          # Shared contract: types, schema, prompt, client
│   │   ├── plans.ts             # Plan catalogue
│   │   ├── supabase.ts          # Client, null when unconfigured
│   │   └── env.ts               # Typed env access, never throws at import
│   ├── pages/                   # One file per route, default-exported, lazy-loaded
│   └── types/database.ts        # Mirror of the SQL schema
├── supabase/migrations/         # Schema, RLS policies, triggers
├── Dockerfile                   # Multi-stage, non-root, healthchecked
└── .github/workflows/ci.yml     # Lint → typecheck → test → build → container smoke test
```

Two rules keep this navigable: **pages compose, features own logic**, and
anything under `src/lib/generation` uses relative imports only, because the
server bundle imports it and does not share the `@/` alias.

---

## Architecture and decisions

### The AI provider is a seam, not a call site

`EmailProvider` is a three-member interface: an id, a model name, and
`stream()`, which yields text chunks. Everything else — validation, auth,
quotas, transport, persistence, error mapping — sits above it and knows nothing
about any particular model.

There are three implementations: Claude, Gemini and the offline writer. That is
not decoration — the second one was added after the fact, and it cost one new
file plus one line in `resolveProvider()`. The prompt builder, the parser, the
streaming transport, the quota logic and every test were untouched.

The offline provider is not a toy: it drives the same streaming path, and it is
what the tests and CI run against, so the pipeline is exercised on every commit
without spending a token.

### One handler, three hosts

`handleGenerate(request, env)` takes a Web `Request` and returns a Web
`Response`. That single signature is hosted by the Vercel function, the Vite dev
middleware, and the Node server in the Docker image, each through the same
`http-adapter.ts`. The alternative — a Vercel-shaped handler plus a separate
local mock — means production runs code that development never exercises.

The Vercel function runs on the **Node runtime, not edge**. Edge would suit a
streaming endpoint better, but the Anthropic SDK pulls in `node:fs` and
`node:path`, which the edge runtime rejects. Given the choice between dropping
the official SDK for hand-rolled HTTP and moving one adapter to Node, the Node
runtime is the smaller compromise — it streams fine, and the handler is
untouched either way.

### Streaming as newline-delimited JSON

The endpoint streams NDJSON frames (`delta`, `done`, `error`) rather than
returning one JSON body. Drafts appear as they are written, which is the
difference between a four-second wait and a four-second progress indicator.
`error` is a frame rather than a status code because by the time a provider
fails mid-stream, the 200 has already been sent.

### Error handling, deliberately layered

The brief asks for no white screens, so there are four nets:

1. `AppError` — a closed set of codes with a user-safe message on every one.
   Supabase and Anthropic errors are translated at their boundaries, never
   surfaced raw.
2. Route `errorElement` — catches loader throws and render errors below a route.
3. `ErrorBoundary` — wraps the router, catching what routing cannot.
4. Inline states — every async surface has explicit loading, empty, and error
   renderings, each with a way forward.

### Quotas are enforced server-side — and row security alone was not enough

The free-plan limit is checked in the handler using the service role key, and
the counter is incremented by a `security definer` function.

That was not sufficient on its own. Row level security decides which *rows* a
role may touch, not which *columns*, so the "owner may update their profile"
policy also let a user `PATCH` their own `generations_used` back to zero using
nothing but the public anon key. The quota was bypassable in one HTTP request —
found by actually trying it against the live project, not by reading the policy.

`0002_lock_quota_column.sql` fixes it with column privileges: `authenticated`
keeps `UPDATE` on `full_name`, `avatar_url` and `plan`, and loses it everywhere
else. The counter is now writable only by the security-definer function and the
service role. `plan` stays writable because the upgrade flow is a mocked
checkout; wiring a real payment provider means dropping it from that grant and
letting the webhook set it.

### Prompting

The system prompt fixes an output contract — `Subject:` on line one, blank
line, body — and the parser treats that contract as advisory: if the marker is
missing, the whole output becomes the body rather than being dropped. The
request runs at `effort: 'low'` with adaptive thinking left on, which is the
right trade for short, routine writing, and server-side fallbacks are enabled so
a policy decline on a borderline topic is retried rather than dead-ending.

---

## Docker

```bash
docker build -t inboxly .
docker run -p 8080:8080 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  inboxly
```

Client-side variables are compiled in, so pass them as build args:

```bash
docker build -t inboxly \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your-anon-key .
```

To try the container with no credentials at all:

```bash
docker run -p 8080:8080 -e EMAIL_PROVIDER=mock -e ALLOW_ANONYMOUS_GENERATION=true inboxly
```

The image is multi-stage, runs as the `node` user, ships a pre-bundled server
with no TypeScript toolchain at run time, and exposes `/healthz`.

---

## Deployment

### Vercel

1. Import the repository at [vercel.com/new](https://vercel.com/new). The Vite
   preset and `vercel.json` are picked up automatically.
2. Add the environment variables from the table above under
   **Settings → Environment Variables**. `VITE_*` values must be present at
   build time.
3. Deploy. `api/generate.ts` becomes a Node function; `vercel.json` rewrites
   everything except `/api/*` to `index.html` so deep links work.

   `GEMINI_API_KEY` is all the live demo needs. If both keys are set, Gemini
   wins; pin `EMAIL_PROVIDER=anthropic` to prefer Claude.

### Anywhere else

`npm run build && npm run build:server && npm start` serves both halves from one
Node process on `PORT` (default 8080) — which is what the Docker image does.

---

## Testing

```bash
npm test
```

37 tests across four files:

- `src/lib/generation/prompt.test.ts` — prompt construction and the response
  parser, including the awkward cases: code fences, a bolded subject label, a
  missing subject line, an over-long subject, empty output.
- `server/generate-handler.test.ts` — the endpoint contract: method and CORS
  handling, malformed JSON, schema rejections, the streaming happy path, and the
  two failure modes that should never be opaque (missing auth, missing config).
- `server/providers/index.test.ts` — the provider selection rules: precedence
  (Gemini first),
  explicit pinning, failing loudly when a pinned provider has no key, and
  degrading to the offline writer rather than breaking.
- `src/features/generator/generator-form.test.tsx` — form behaviour through the
  DOM: validation blocking submission, defaults being submitted, recipient
  trimming, the busy and quota-blocked states.

The suite runs in two Vitest projects: components under jsdom, server code under
node. The Anthropic SDK refuses to construct in a browser-like environment —
correctly, since that would imply an API key in a browser — so a single shared
environment cannot cover both.

They run against the offline provider, so the suite needs no API key and no
network.

---

## What is not built

Stated plainly, because a demo that pretends is worse than one that admits:

- **Payments.** Stripe is not integrated. The upgrade flow is a real flow with a
  mocked processor: it says so on screen, and it does move the account onto the
  plan so the quota actually lifts.
- **Password reset.** Sign-up, sign-in, sign-out and password change work;
  "forgot password" is not wired up.
- **Account deletion.** Requires the Supabase admin API and a server route.
- **History paging.** The dashboard shows the 20 most recent drafts.
- **E2E tests.** The suite is unit and component level; there is no Playwright
  run in CI.
