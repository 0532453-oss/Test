# PRD: FlexDesk Agent -- Deployment Readiness

## Introduction

`@flexdesk/agent` is a Node.js/TypeScript AI agent service within the FlexDesk pnpm + Nx monorepo. It provides 24/7 automated customer communication powered by OpenClaw, handling SMS conversations (via Twilio), appointment booking (via Google Calendar), CRM sync (via Airtable or FlexDesk API), and daily brief generation. The codebase already has substantial structure: a `FlexDeskAgent` class orchestrating skills (`src/core/agent.ts`), a `ConversationHandler` with intent detection and multi-step booking flow (`src/core/conversation.ts`), a `MemorySystem` for file-based conversation persistence (`src/core/memory.ts`), a `Scheduler` for daily briefs and follow-ups (`src/core/scheduler.ts`), a structured `Logger` (`src/core/logger.ts`), and four skills: TwilioSkill (with webhook signature validation and TwiML escaping), CalendarSkill (Google Calendar CRUD), AirtableSkill (with formula injection protection), and FlexDeskSkill (full CRUD against the FlexDesk API). Templates for confirmations, daily briefs, and weekly reports exist. A security review (`SECURITY_REVIEW.md`) identified 8 issues: 2 critical (fixed), 3 high (1 fixed), 2 medium, and 1 low. This PRD covers the remaining work to make the agent production-deployable.

## Goals

- Create an HTTP server with a Twilio webhook endpoint so the agent can receive and respond to incoming SMS
- Complete the FlexDesk API skill integration so the agent creates real customers, jobs, and invoices
- Implement daily brief generation and delivery using real CRM data
- Add retry logic and fallback messages for AI model failures
- Add per-customer rate limiting on conversations
- Move conversation storage from plaintext JSON files to a more robust solution
- Validate all required environment variables at startup using Zod
- Add a health check endpoint for deployment monitoring
- Replace `console.log/error` with the structured Logger across all skills
- Write unit tests for each skill and the conversation handler

## User Stories

---

### US-A01: Create HTTP server with Twilio webhook endpoint

**Description:** As the agent, I need an HTTP server that listens for incoming Twilio webhook POST requests so I can receive and respond to customer SMS messages.

**Acceptance Criteria:**

- [ ] Create `src/server.ts` using Express (or the Node HTTP module) listening on `PORT` env var (default 3003)
- [ ] Mount `POST /webhooks/twilio/sms` route using the existing `createTwilioWebhookHandler()` from `src/skills/twilio/index.ts`
- [ ] Pass `authToken` and `webhookUrl` options to the handler for Twilio signature validation (already required after the security fix)
- [ ] Add `express.urlencoded({ extended: false })` middleware for Twilio's form-encoded body
- [ ] Add a body size limit of 10KB on the webhook route
- [ ] Log incoming requests at DEBUG level using the Logger
- [ ] Return 200 with empty TwiML `<Response></Response>` on successful processing (already handled by the webhook helper)
- [ ] Return 403 on invalid Twilio signature (already handled)
- [ ] Return 500 with generic error on unhandled exceptions (do not leak stack traces)
- [ ] Update `src/index.ts` main function to start both the HTTP server and the agent
- [ ] Typecheck passes

---

### US-A02: Validate environment variables at startup with Zod

**Description:** As a developer deploying the agent, I want the process to fail fast with a clear error message if required environment variables are missing, rather than crashing deep in skill initialization.

**Acceptance Criteria:**

- [ ] Create `src/config.ts` with a Zod schema for all required and optional env vars
- [ ] Required vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `BUSINESS_NAME`, `BUSINESS_PHONE`
- [ ] Optional vars with defaults: `AGENT_NAME` (default "Dispatch"), `AGENT_TIMEZONE` (default "America/Phoenix"), `PORT` (default "3003"), `FLEXDESK_DEBUG` (default "false"), `FLEXDESK_LOG_JSON` (default "false")
- [ ] Conditional required: if `FLEXDESK_API_URL` is set, then `FLEXDESK_API_KEY` is also required; if `AIRTABLE_API_KEY` is set, then `AIRTABLE_BASE_ID` is also required
- [ ] Conditional required: if `GOOGLE_CLIENT_ID` is set, then `GOOGLE_CLIENT_SECRET` and `GOOGLE_REDIRECT_URI` are also required
- [ ] On validation failure: log every missing/invalid var with its expected type, then `process.exit(1)`
- [ ] Export the validated config object for use throughout the codebase
- [ ] Replace all `process.env.X` reads in `agent.ts` and `index.ts` with the validated config
- [ ] Typecheck passes

---

### US-A03: Add health check endpoint

**Description:** As a DevOps engineer, I want a health check endpoint so deployment platforms (Railway, Docker, Kubernetes) can verify the agent is running.

**Acceptance Criteria:**

- [ ] Add `GET /health` route in `src/server.ts`
- [ ] Response: `{ status: "ok", uptime: <seconds>, skills: { twilio: true/false, calendar: true/false, crm: true/false }, activeConversations: <count> }`
- [ ] The `skills` object reflects which skills were successfully initialized (not just configured)
- [ ] `activeConversations` comes from `MemorySystem.getStats().activeConversations`
- [ ] Response code: 200 if all critical skills (Twilio) are initialized, 503 if Twilio is down
- [ ] No auth required on the health endpoint
- [ ] Typecheck passes

---

### US-A04: Replace console.log/error with structured Logger in all skills

**Description:** As a developer, I want all logging to go through the structured Logger so log output is consistent, filterable, and does not accidentally leak API keys or customer PII in error objects.

**Acceptance Criteria:**

- [ ] In `src/skills/airtable/index.ts`: replace all 7 `console.error` calls with `this.logger.error(message, error)` where `error` is an Error instance (log only `.message`, not the full object)
- [ ] In `src/skills/calendar/index.ts`: replace all 6 `console.error` and `console.log` calls with Logger equivalents
- [ ] In `src/skills/flexdesk/index.ts`: replace all 14 `console.error` and 1 `console.log` calls with Logger equivalents
- [ ] In `src/skills/twilio/index.ts`: replace the remaining `console.log` call in `initializeClient` with Logger
- [ ] Each skill class should instantiate its own `Logger` (e.g., `private logger = new Logger('AirtableSkill')`)
- [ ] Error handlers log only `error.message` for Error instances, never the full error object (prevents leaking credentials in axios error objects)
- [ ] Typecheck passes

---

### US-A05: Implement daily brief generation and delivery

**Description:** As a business owner, I want to receive a morning SMS brief with today's schedule, yesterday's activity, and any overdue invoices, so I can plan my day.

**Acceptance Criteria:**

- [ ] Implement `sendDailyBrief()` in `src/core/agent.ts` (currently a TODO stub)
- [ ] Fetch today's schedule from the CRM skill (`getTodaySchedule()` or `getJobs(today, tomorrow)`)
- [ ] Fetch overdue invoices from the CRM skill (`getOverdueInvoices()`)
- [ ] Fetch stats from the memory system (`getStats()`)
- [ ] Call `generateMorningBrief()` from `src/templates/daily-brief.ts` with the collected data
- [ ] Send the brief to the business owner's phone via `TwilioSkill.sendMessage(config.businessPhone, brief)`
- [ ] The scheduler already calls `sendDailyBrief()` at `config.briefTime`; verify the timer is configured correctly
- [ ] If any data fetch fails, send a truncated brief with available data and a note about what failed
- [ ] Log brief generation at INFO level with message count and character count
- [ ] Typecheck passes

---

### US-A06: Add per-customer conversation rate limiting

**Description:** As the agent operator, I want to limit the number of messages processed per phone number per minute, so a single customer (or attacker) cannot exhaust Twilio credits or overwhelm the system.

**Acceptance Criteria:**

- [ ] Create `src/core/rate-limiter.ts` with a `RateLimiter` class
- [ ] Constructor accepts `maxRequests` (default 10) and `windowMs` (default 60000 = 1 minute)
- [ ] `isAllowed(key: string): boolean` method that returns false if the key has exceeded `maxRequests` in the current window
- [ ] Use a simple sliding window counter stored in a `Map<string, number[]>` (array of timestamps)
- [ ] Clean up expired entries periodically (every 5 minutes) to prevent memory growth
- [ ] In `agent.ts` `handleIncomingMessage()`: check rate limiter before processing
- [ ] If rate-limited: send a single response "You're sending messages too quickly. Please wait a moment and try again." and do not process the message
- [ ] Do not send the rate-limit response more than once per window (track last rate-limit reply timestamp)
- [ ] Log rate-limited messages at WARN level with the phone number
- [ ] Typecheck passes

---

### US-A07: Add retry logic and fallback messages for AI/API failures

**Description:** As a customer texting the business, I want to receive a helpful response even if the AI model or backend API is temporarily down, so I am not left without a reply.

**Acceptance Criteria:**

- [ ] In `agent.ts` `handleIncomingMessage()`: wrap `conversationHandler.process()` in a try/catch with retry
- [ ] Retry up to 2 times with 1-second delay between attempts
- [ ] If all retries fail: send a fallback message via Twilio: "Sorry, I'm having trouble right now. Please call us at {businessPhone} or try again in a few minutes."
- [ ] If Twilio send itself fails (rate-limited, network error): log at ERROR level but do not crash the process
- [ ] In `conversationHandler.process()`: if CRM skill calls fail during booking flow, respond with "I'm having trouble checking our schedule right now. Someone will get back to you shortly."
- [ ] Track failure count per 5-minute window; if > 10 failures, log an ALERT-level message "High failure rate detected"
- [ ] Typecheck passes

---

### US-A08: Improve conversation history storage

**Description:** As a developer, I want conversation data stored more robustly than bare JSON files, with size limits and automated cleanup, so the data directory does not grow unbounded.

**Acceptance Criteria:**

- [ ] Add a maximum conversation history size: if a conversation exceeds 100 messages, archive the oldest 50 messages to the archive directory and keep only the most recent 50
- [ ] Add a maximum message length: truncate incoming messages to 1600 characters (SMS concatenation limit) before storing
- [ ] Strip control characters (except newlines) from message content before storage
- [ ] Add an automated cleanup: on agent startup, archive conversations that have been inactive for more than 7 days
- [ ] Add file permissions: set data directory and all files to mode 0700/0600 (owner-only access) on creation
- [ ] Log cleanup activity at INFO level: "Archived X inactive conversations"
- [ ] Typecheck passes

---

### US-A09: Remove `withCredentials: true` from FlexDesk API client

**Description:** As a developer, I want to remove the unnecessary `withCredentials: true` from the FlexDesk skill's axios client, since this is a server-side service using Bearer token auth and sending cookies is incorrect.

**Acceptance Criteria:**

- [ ] In `src/skills/flexdesk/index.ts`, remove `withCredentials: true` from the axios.create config (line 23)
- [ ] Verify the FlexDesk skill still authenticates correctly using the Bearer token header
- [ ] Typecheck passes

---

### US-A10: Wire the FlexDesk skill into the booking flow with create-job and create-invoice

**Description:** As the agent, when I book an appointment for a customer, I want the job to be created in the FlexDesk system (not just Airtable), so the admin dashboard and mobile app see it immediately.

**Acceptance Criteria:**

- [ ] In `agent.ts` `bookAppointment()`: when `crmSkill` is a `FlexDeskSkill`, call `createJob()` with the booking data
- [ ] After job creation, if the customer is new, call `createCustomer()` first (the `FlexDeskSkill.createJob()` already handles find-or-create, so verify this path works)
- [ ] After a job is completed (via a "job completed, send invoice" flow), call `createInvoiceFromJob(jobId)` and `sendInvoice(invoiceId)`
- [ ] Add a new conversation intent `confirm_completion` that triggers the invoice creation flow
- [ ] Log all CRM operations at INFO level with entity IDs
- [ ] Typecheck passes

---

### US-A11: Write unit tests for the ConversationHandler

**Description:** As a developer, I want unit tests covering the conversation handler's intent detection and booking flow, so I can refactor confidently.

**Acceptance Criteria:**

- [ ] Create `src/core/__tests__/conversation.test.ts`
- [ ] Test intent detection: "My AC is broken" -> `book_service`, "emergency no heat" -> `emergency`, "how much does it cost" -> `get_quote`, "cancel my appointment" -> `cancel`, "reschedule" -> `reschedule`, "do you do plumbing?" -> `question`
- [ ] Test booking flow: multi-message sequence providing address, issue, and time results in a `book_appointment` action
- [ ] Test emergency flow: emergency message returns emergency response with fee and notify_owner action
- [ ] Test unknown intent: generic greeting returns the welcome message
- [ ] Configure Jest in `package.json` (jest config or `jest.config.ts`) with `ts-jest` preset
- [ ] All tests pass with `pnpm test`
- [ ] Typecheck passes

---

### US-A12: Write unit tests for the TwilioSkill

**Description:** As a developer, I want unit tests for the Twilio skill's message sending, webhook handling, and signature validation.

**Acceptance Criteria:**

- [ ] Create `src/skills/twilio/__tests__/twilio.test.ts`
- [ ] Mock the `twilio` module to avoid real API calls
- [ ] Test `sendMessage()`: verifies `client.messages.create` is called with correct `to`, `from`, `body`
- [ ] Test `handleIncomingWebhook()`: verifies registered message handlers are called with `From` and `Body`
- [ ] Test `escapeXml()`: verifies `<`, `>`, `&`, `"`, `'` are properly escaped
- [ ] Test `createTwilioWebhookHandler()`: verifies 403 response on invalid signature, 200 with TwiML on valid
- [ ] All tests pass with `pnpm test`
- [ ] Typecheck passes

---

### US-A13: Write unit tests for the rate limiter

**Description:** As a developer, I want unit tests for the rate limiter to verify it correctly allows and blocks requests.

**Acceptance Criteria:**

- [ ] Create `src/core/__tests__/rate-limiter.test.ts`
- [ ] Test: first N requests within the window are allowed
- [ ] Test: request N+1 within the window is blocked
- [ ] Test: after the window expires, requests are allowed again
- [ ] Test: different keys (phone numbers) have independent limits
- [ ] Test: cleanup removes expired entries
- [ ] All tests pass with `pnpm test`
- [ ] Typecheck passes

---

### US-A14: Write unit tests for daily brief template generation

**Description:** As a developer, I want unit tests for the daily brief templates to verify they produce correctly formatted output.

**Acceptance Criteria:**

- [ ] Create `src/templates/__tests__/daily-brief.test.ts`
- [ ] Test `generateMorningBrief()`: output includes date, schedule count, job titles, overdue invoice count
- [ ] Test `generateMorningBrief()` with empty schedule: output includes "No jobs scheduled yet"
- [ ] Test `generateEveningBrief()`: output includes today's stats and tomorrow's schedule
- [ ] Test `generateWeeklyReport()`: output includes lead summary, revenue, conversion rate
- [ ] All tests pass with `pnpm test`
- [ ] Typecheck passes

---

### US-A15: Add structured logging for all agent operations

**Description:** As a developer monitoring the agent in production, I want every significant operation logged in a structured format so I can search and filter logs effectively.

**Acceptance Criteria:**

- [ ] In `agent.ts`: log at INFO level when a message is received (phone hash, not full number), when a response is sent, and when an action is executed
- [ ] In `agent.ts`: log at DEBUG level the intent detected and extracted data (redact address and phone in production)
- [ ] In `conversation.ts`: remove the existing `console.log` calls (if any remain) and use Logger
- [ ] In `scheduler.ts`: log at INFO when a scheduled task fires and when it completes
- [ ] In `memory.ts`: log at INFO when conversations are archived or cleaned up
- [ ] Ensure `FLEXDESK_LOG_JSON=true` produces valid JSON lines on stdout (already supported by Logger)
- [ ] Ensure no PII (full phone numbers, addresses) appears in INFO-level logs; only in DEBUG level
- [ ] Typecheck passes

## Non-Goals

- No web-based admin UI for the agent (managed via environment variables and CRM)
- No voice call handling beyond the existing TwiML `<Say>` outbound call (no inbound call routing)
- No multi-language message support (English only)
- No AI model integration in this PRD (the conversation handler uses keyword-based intent detection; LLM integration is a separate effort)
- No database migration from file storage to PostgreSQL (architectural decision deferred)
- No WhatsApp or iMessage channel support (Twilio SMS only)
- No customer self-service via the agent (that is the portal's job)

## Technical Considerations

- All source files live in `packages/flexdesk-agent/`
- The agent compiles to `dist/` via `tsc` and runs with `node dist/index.js`
- The `tsconfig.json` extends the monorepo base and targets ES2020 with CommonJS modules
- Dependencies: `twilio@^4.20.0`, `googleapis@^130.0.0`, `airtable@^0.12.2`, `axios@^1.6.0`, `dotenv@^16.3.1`, `zod@^3.22.0`
- Dev dependencies include Jest, ts-jest, and ESLint with TypeScript plugin
- The security review (`SECURITY_REVIEW.md`) identified remaining issues: error logging leaking sensitive info in airtable/calendar/flexdesk skills (HIGH-1 partially fixed), no input validation on incoming SMS (HIGH-2), plaintext conversation storage (HIGH-3), `withCredentials: true` in FlexDesk client (MEDIUM-1), debug logging exposing message content (MEDIUM-2), no env validation (LOW-1)
- The `createTwilioWebhookHandler()` already requires `authToken` and `webhookUrl` for signature validation (CRITICAL-1 fixed)
- The `escapeFormulaValue()` function protects against Airtable formula injection (CRITICAL-2 fixed)
- The `sanitizeFilename()` function prevents path traversal in the memory system
- Express is not currently a dependency; it needs to be added for the HTTP server, or use the built-in `http` module
- The agent is designed to run as a long-lived process (not serverless); deploy on Railway, Render, or a VPS
