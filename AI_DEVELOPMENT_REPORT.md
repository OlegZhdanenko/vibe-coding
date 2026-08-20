# AI Development Report

How this project was actually built, what the AI did well, where it was wrong,
and what I would do next.

- **Live demo:** https://vibe-coding-two-bice.vercel.app
- **Repository:** https://github.com/OlegZhdanenko/vibe-coding

---

## 1. Tools and models

| Tool | Model | Used for |
|---|---|---|
| **Claude Code** (CLI, in VS Code) | **Claude Opus 5** (`claude-opus-5`) | The entire build: planning, code, tests, docs, debugging, verification |
| **shadcn/ui CLI** | — | Vendoring the Radix-based component primitives |
| **Headless Chrome via CDP** | — | Driven by the agent to screenshot and measure the running app |
| **Google Gemini API** | **Gemini 3.6 Flash** (`gemini-3.6-flash`) | The product — the model that writes the emails |
| **Anthropic API** | **Claude Opus 5** (`claude-opus-5`) | The product's original backend, since removed — see below |

One agent, one model. I deliberately did not spread the work across several
assistants: the value of an agentic tool is that it holds the whole repository
in context, and splitting the work would have meant re-establishing that context
repeatedly.

**The provider seam, exercised in both directions.** The build started on Claude
alone. Gemini was added later, when the Anthropic account turned out to have no
credit; Claude was then removed once Gemini was confirmed working. Both moves
cost one file and one case in `resolveProvider()`, and neither touched the
prompt builder, the parser, the streaming transport, the quota logic or any of
their tests.

That history is the point. "The architecture allows the model to be swapped" is
easy to claim and hard to believe; doing it twice, in opposite directions,
against a working deployment, is evidence.

**Model settings.** `gemini-3.6-flash` with `thinkingLevel: 'low'`. Writing one
short email is routine work, and the default spends tokens and latency on
reasoning the task does not need. The Claude provider used the equivalent
`output_config.effort: 'low'` for the same reason, with adaptive thinking left
on to avoid the known failure modes of disabling it outright.

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

Twenty prompts, in the order they mattered. Some are my literal messages
(marked *mine*); the rest are the specific instructions and self-corrections
that actually changed the code, written as prompts so they are reusable.

> **1. (mine — the whole brief)**
> "потрібно реалізувати функціонал згідно докам […] розроби покроковий план",
> pasted with the full assignment, then "поїхали" to approve execution.
> Asking for a plan rather than code was the single highest-leverage decision:
> it surfaced every blocking question before a file was written.

> **2. (agent → me, clarifying)** "Which auth, which AI provider, which deploy
> target, which UI stack?" — four options each, recommendation first, trade-off
> spelled out. Answers: Supabase, a real API, Vercel, Tailwind + shadcn/ui +
> Framer Motion.

> **3.** "Before writing any provider code, verify the current model IDs,
> parameters and streaming API rather than relying on recalled patterns."
> — caught that `budget_tokens` is removed on current Claude models and that
> `effort` lives inside `output_config`; later caught that `gemini-2.5-flash`
> is no longer issued to new accounts.

> **4.** "Design the AI integration so the model can be swapped by adding one
> file. Everything above the seam — validation, quotas, transport, persistence
> — must know nothing about the provider."
> — produced `EmailProvider` and `resolveProvider()`, which later absorbed both
> adding Gemini and removing Claude without touching anything else.

> **5.** "Write the endpoint as `(Request, env) => Response` so the same
> function can be hosted by Vercel, the Vite dev server and a plain Node server.
> No second implementation for local development."

> **6.** "Stream the result as newline-delimited JSON with `delta`, `done` and
> `error` frames. Mid-stream failures must arrive as a frame, because the HTTP
> status has already been sent by then."

> **7.** "Build the error handling before the first feature: a closed set of
> error codes, each with a user-safe message, a route `errorElement`, a render
> boundary above the router, and explicit loading, empty and error states on
> every async surface."

> **8.** "Enforce the free-plan quota on the server with the service role key. A
> client-side check is a suggestion, not a rule."

> **9.** "Write the SQL migration with row level security on both tables, a
> trigger that creates the profile row inside the signup transaction, and a
> `security definer` function for the usage counter. Make it idempotent."

> **10.** "The prompt asks the model for `Subject:` on the first line. Treat
> that as advisory: if the marker is missing, the entire output becomes the
> body. Never drop the email because the format slipped."
> — the parser test suite came directly from this instruction.

> **11. (self-correction, real bug)** "Supabase queries are typing `update()` as
> `never`. Find the cause rather than casting it away."
> — root cause: `Database` was declared with `interface`. Interfaces get no
> implicit index signature, so the schema silently failed postgrest's
> `Record<string, unknown>` constraint and every query degraded to `never`. A
> cast would have hidden a real loss of type safety across the data layer.

> **12. (self-correction, real bug)** "The bolded-subject test fails: the parser
> returns `** Invoice 204`." — the regex allowed `**` before the colon but not
> after. Found by a test written specifically for model output that *disobeys*
> the prompt, which is what you actually get some percentage of the time.

> **13. (verification discipline)** "Blank sections and clipped mobile
> screenshots — decide whether each is a real bug or a tooling artefact before
> changing anything."
> — both were artefacts. Headless Chrome's layout viewport was smaller than the
> requested window, so scroll-triggered reveals never fired; and Chrome will not
> size a window below ~500px on macOS. Driving it over CDP with real device
> metrics and measuring `scrollWidth` against `innerWidth` gave `390 === 390`.
> A less careful pass would have "fixed" working code twice.

> **14. (self-correction, real bug)** "Verify the Docker image by running it,
> then read the logs, not just the status codes."
> — every smoke test passed while the container quietly downloaded `tsx` at
> startup: a network-dependent boot that would fail in an air-gapped or
> rate-limited environment. Replaced with an esbuild bundle and plain `node`.

> **15.** "Every lint error gets fixed at the source, not disabled, and no
> tooling guard gets weakened to make a test pass."
> — three React Compiler diagnostics turned out to be real improvements; one
> warranted an inline disable, with a comment explaining why. Later the same
> rule applied when the Anthropic SDK refused to construct under jsdom: the SDK
> was right, so the suite was split into jsdom and node projects rather than
> overriding the guard.

> **16. (verification, found a security hole)** "The schema is live — now try to
> break it. Can a second user read the first user's drafts? Can a user reset
> their own quota counter?"
> — isolation held, but the quota did not: a plain `PATCH` with the public anon
> key set `generations_used` back to zero. Row security gates rows, not columns.
> Fixed with column privileges in `0002_lock_quota_column.sql`.

> **17. (mine)** "Which AI can be used for free — OpenAI? Gemini?", and later
> "remove every mention of `ANTHROPIC_API_KEY`."
> — OpenAI has no free API tier; Gemini's is genuinely free and needs no card.
> Adding it, then removing Claude, exercised the seam from prompt 4 in both
> directions. The removal was taken as deleting the provider, not just its
> documentation: code that reads a variable the docs refuse to acknowledge is
> worse than either option alone.

> **18. (self-correction, real bug)** "A 400 from the provider covers both a
> malformed request and an exhausted credit balance, and we tell the user to
> shorten their topic. Separate them."
> — a billing problem was being reported as a user error, sending people to fix
> something that was not theirs to fix.

> **19. (deployment failures, real)** "Vercel rejected the deploy over
> `node:fs` in the edge function; then the deployed app still reported missing
> Supabase keys although the dashboard showed them set."
> — two distinct traps. The Anthropic SDK is not edge-compatible, so the
> function moved to the Node runtime and the Node↔Web adapter was extracted and
> shared by all three hosts. The second was worse: the variables had been
> created as Vercel's **sensitive** type, which is withheld from the build step,
> so the `VITE_*` values never reached the bundle while every dashboard and API
> listing showed them present. Visible only by grepping the built artefact.

> **20.** "Write the README's 'what is not built' section honestly, and verify
> every claim by running something — `curl` the stream, screenshot the pages,
> boot the container, attack the live database. A demo that pretends is worse
> than one that admits."

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
- **It reported a billing failure as the user's mistake.** Anthropic returns 400
  for both a malformed request and an empty credit balance. One mapping covered
  both, so "add credits to your account" reached the user as "try shortening the
  topic" — an error message that actively misdirects is worse than a generic one.
- **It picked a runtime without checking what the dependency needed.** The edge
  runtime is the obvious choice for a streaming endpoint, and it typechecked,
  built, and passed every local test — because none of that exercises Vercel's
  module restrictions. The failure appeared only at deploy time. Local green is
  not deployment green.
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
