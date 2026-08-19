# AI Development Report

How this project was actually built, what the AI did well, where it was wrong,
and what I would do next.

---

## 1. Tools and models

| Tool | Model | Used for |
|---|---|---|
| **Claude Code** (CLI, in VS Code) | **Claude Opus 5** (`claude-opus-5`) | The entire build: planning, code, tests, docs, debugging, verification |
| **shadcn/ui CLI** | — | Vendoring the Radix-based component primitives |
| **Headless Chrome via CDP** | — | Driven by the agent to screenshot and measure the running app |
| **Anthropic API** | **Claude Opus 5** (`claude-opus-5`) | The product itself — the model that writes the emails |

One agent, one model. I deliberately did not spread the work across several
assistants: the value of an agentic tool is that it holds the whole repository
in context, and splitting the work would have meant re-establishing that context
repeatedly.

**Model choice for the product.** `claude-opus-5` with `output_config.effort:
'low'` and adaptive thinking left on. Writing one short email is routine work,
so low effort keeps it fast and cheap, while leaving thinking enabled avoids the
known failure modes of disabling it outright. Server-side fallbacks
(`fallbacks: 'default'`) are enabled so a policy decline on a borderline topic
is retried on another model inside the same call instead of dead-ending.

---

## 2. How the process actually worked

The shape of the work was **plan → decide → build in vertical slices → verify
each slice → commit**, with the agent running its own tools (shell, editor,
typechecker, linter, test runner, browser) between my instructions.

1. **Spec in, plan out.** I pasted the assignment and asked for a step-by-step
   plan rather than code. The agent first read the existing repository — finding
   a bare Vite template, zero commits, no deployment CLIs, Docker present, no
   API keys — so the plan was grounded in the actual starting state.
2. **Four blocking decisions, asked up front.** Auth provider, AI provider,
   deploy target, UI stack. These were the only questions where a wrong guess
   would have meant rework, so it asked them together instead of drip-feeding.
3. **Autonomous execution in phases.** Each phase ended with typecheck, lint,
   tests and a commit. Six commits, each one a working state.
4. **Verification, not assertion.** Every claim was checked by running
   something: `curl` against the streaming endpoint, screenshots of the rendered
   pages, a container smoke test. Several bugs surfaced only this way.

### What that looked like in practice

The agent wrote the error-handling layer **before** the first feature, because
"no white screens" is a structural property, not something you retrofit. It
built the auth context before the header, so the header consumed real session
state instead of being rewritten later. That ordering came out of the planning
step and saved a meaningful amount of churn.

---

## 3. The prompts that shaped the project

The first two are my literal messages. The rest are the specific instructions
and self-corrections that actually changed the code — I have written them as
prompts so they are reusable, and marked which were mine and which were the
agent's own steering.

> **1. (mine — the whole brief)**
> "потрібно реалізувати функціонал згідно докам […] розроби покроковий план"
> — pasted with the full assignment text. Asking for a plan rather than code
> was the single highest-leverage decision: it surfaced the blocking questions
> before any file was written.

> **2. (mine)** "поїхали" — approval to execute the plan autonomously.

> **3. (agent → me, clarifying)** "Which auth, which AI provider, which deploy
> target, which UI stack?" — four options each, with a recommendation first and
> the trade-off spelled out. Answers: Supabase, real Anthropic API, Vercel,
> Tailwind + shadcn/ui + Framer Motion.

> **4.** "Before writing any Anthropic code, verify the current model IDs,
> parameters and streaming API rather than relying on recalled patterns."
> — this caught that `budget_tokens` is removed on current models and that
> `effort` lives inside `output_config`, not at the top level.

> **5.** "Design the AI integration so the model can be swapped by adding one
> file. Everything above the seam — validation, quotas, transport, persistence
> — must know nothing about Claude."
> — produced `EmailProvider` and `resolveProvider()`.

> **6.** "Write the endpoint as `(Request, env) => Response` so the same
> function can be hosted by the Vercel edge runtime, the Vite dev server and a
> plain Node server. No second implementation for local development."
> — the decision that later made the Docker image trivial.

> **7.** "Stream the result as newline-delimited JSON with `delta`, `done` and
> `error` frames. Mid-stream failures must arrive as a frame, because the HTTP
> status has already been sent by then."

> **8.** "Build the error handling before the first feature: a closed set of
> error codes, each with a user-safe message, a route `errorElement`, a render
> boundary above the router, and explicit loading/empty/error states on every
> async surface."

> **9.** "Enforce the free-plan quota on the server with the service role key. A
> client-side check is a suggestion, not a rule."

> **10.** "Write the SQL migration with row level security on both tables, a
> trigger that creates the profile row inside the signup transaction, and a
> `security definer` function for the usage counter. Make it idempotent."

> **11.** "The prompt asks the model for `Subject:` on the first line. Treat
> that as advisory: if the marker is missing, the entire output becomes the
> body. Never drop the email because the format slipped."
> — the parser test suite came directly from this instruction.

> **12. (self-correction, real bug)** "Supabase queries are typing `update()` as
> `never`. Find the cause rather than casting it away."
> — root cause: `Database` was declared with `interface`. Interfaces get no
> implicit index signature, so the schema silently failed postgrest's
> `Record<string, unknown>` constraint and every query degraded to `never`.
> Switching to `type` fixed it. A cast would have hidden a real loss of type
> safety across the whole data layer.

> **13. (self-correction, real bug)** "The bolded-subject test fails: the parser
> returns `** Invoice 204`." — the regex allowed `**` before the colon but not
> after, so `**Subject:** Invoice 204` leaked asterisks into the subject. Found
> by a test written specifically for model output that does not follow
> instructions.

> **14. (verification)** "The features section renders blank in the screenshot —
> determine whether that is a real bug or a headless artifact before changing
> anything."
> — it was an artifact: headless Chrome's layout viewport was smaller than the
> requested window, so scroll-triggered reveals never fired. Confirmed by
> screenshotting a section that sits above the fold and seeing it render
> correctly. No code change; a less careful pass would have "fixed" working
> code.

> **15. (verification)** "Mobile screenshots look clipped. Chrome will not size
> a window below ~500px on macOS — drive it over CDP with real device metrics
> and measure `scrollWidth` against `innerWidth`."
> — result: `390 === 390`, no horizontal overflow. The clipping was the tool,
> not the layout.

> **16. (self-correction, real bug)** "The container logs show `npx` downloading
> tsx at startup. The runtime image must not fetch anything or carry a
> TypeScript toolchain."
> — replaced with an esbuild bundle and `node dist-server/index.js`.

> **17.** "Every lint error gets fixed at the source, not disabled. If a rule
> genuinely does not apply, disable that one line and write down why."
> — three React Compiler diagnostics turned out to be real improvements (lazy
> state initialisation, a ref read during render, a `setState` in an effect);
> exactly one warranted an inline disable, with a comment explaining it.

> **18.** "Verify the Docker image by running it: health endpoint, static
> files, SPA deep link, and a streaming generation. A build that succeeds is
> not a container that works."

> **19.** "Write the README's 'what is not built' section honestly. A demo that
> pretends is worse than one that admits."

> **20. (verification, found a security hole)** "The schema is live — now try to
> break it. Can a second user read the first user's drafts? Can a user reset
> their own quota counter?"
> — isolation held, but the quota did not: a plain `PATCH` with the public anon
> key set `generations_used` back to zero. Fixed in `0002_lock_quota_column.sql`
> with column privileges.

---

## 4. Where the AI was wrong

Worth recording, because the failure modes are more instructive than the
successes:

- **It reached for a cast when the type system was telling the truth.** The
  `never` typing bug had an obvious "fix" (`as any`) that would have silently
  removed type safety from every database call. Only investigating the root
  cause found the `interface` vs `type` distinction.
- **It trusted a happy-path regex.** The subject parser looked correct and
  passed on well-formed input. The bug only appeared because a test was written
  for output that *disobeys* the prompt — which is the output you actually get
  from a language model some percentage of the time.
- **It nearly "fixed" a non-bug.** Blank sections in a screenshot looked like a
  serious rendering failure. The instinct to change code immediately would have
  damaged working animation logic; the discipline of confirming the diagnosis
  first prevented it.
- **It confused row security with column security.** The migration enabled RLS,
  wrote owner policies, and put the quota check on the server — all of which
  read as correct. But RLS gates *rows*, not *columns*, so the "owner may update
  their profile" policy also allowed `PATCH {"generations_used": 0}` from the
  browser. The free-plan limit was bypassable in one HTTP request. Nothing in
  the code review would have caught it; only attacking the live project did.
- **It shipped a container that worked but was wrong.** The first image passed
  every smoke test while quietly downloading a package at startup — a
  network-dependent boot that would fail in an air-gapped or rate-limited
  environment. Reading the logs, not just the status codes, caught it.

The pattern: the AI produces plausible, well-structured code very fast, and the
value a developer adds is almost entirely in **deciding what to verify** and
**refusing to accept a workaround before understanding the cause**.

The quota hole is the sharpest example. Every individual piece was defensible —
RLS on, policies scoped to the owner, server-side check, atomic increment — and
the flaw only existed in the gap between two of them. Reviewing the diff would
not have found it. Sending one hostile HTTP request did.

---

## 5. What I would do with more time

**Correctness and confidence**
- Playwright end-to-end tests covering the real journey: sign up → generate →
  upgrade → history, run against a seeded Supabase branch in CI.
- Tests for the auth provider and the streaming client, both currently covered
  only indirectly.
- Contract tests against the real Anthropic API on a nightly schedule, so an API
  change surfaces before a user finds it.

**Product**
- Refinement instead of regeneration: "make it shorter", "warmer", "add the
  deadline" as follow-up turns on an existing draft, which is where a real user
  spends their time.
- Saved tone presets learned from a user's own sent mail — the difference
  between "professional" and "how *you* write professionally".
- Search and paging over history, plus folders or tags.
- Real Stripe integration behind the existing upgrade flow, which was built with
  that seam in mind.

**Engineering**
- Rate limiting per user and per IP at the edge; the quota protects the business
  but not the endpoint.
- Prompt caching on the system prompt, which is identical across every request
  and currently paid for every time.
- Structured logging and tracing on the generation path, with latency and token
  spend per request.
- Preview deployments per pull request, and a staging Supabase project so
  migrations are exercised before they touch production data.
- An `AbortSignal` path all the way to the provider so cancelling in the UI stops
  billing immediately, rather than only closing the reader.

**Accessibility and polish**
- A full keyboard and screen-reader pass; the semantics are there, but it has not
  been tested with an actual screen reader.
- Skeleton states that match the final layout more precisely, to remove the
  small layout shift when a draft resolves.
