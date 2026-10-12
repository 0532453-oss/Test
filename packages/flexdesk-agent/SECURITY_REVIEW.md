# Security Review: flexdesk-agent

**Date:** 2026-02-08
**Reviewer:** security-reviewer agent
**Package:** `@flexdesk/agent` v0.1.0
**Scope:** Full review of all source files in `packages/flexdesk-agent/src/`

---

## Summary

The flexdesk-agent package was **not covered** by the Feb 2026 security audit that addressed 60+ issues in the server package. This review found **8 issues** across the agent codebase.

| Severity | Count | Fixed in this review |
|----------|-------|---------------------|
| Critical | 2     | 2                   |
| High     | 3     | 1                   |
| Medium   | 2     | 0                   |
| Low      | 1     | 0                   |

---

## Issues Found

### CRITICAL-1: Missing Twilio Webhook Signature Validation [FIXED]

**File:** `src/skills/twilio/index.ts` (line 174, `createTwilioWebhookHandler`)
**Status:** Fixed

The `createTwilioWebhookHandler` Express middleware accepted any incoming POST request without verifying the `X-Twilio-Signature` header. This means an attacker could forge webhook calls to the endpoint, injecting fake SMS messages that the agent would process and respond to.

**Impact:** An attacker could:
- Trigger fake bookings and customer records in the CRM
- Cause the agent to send SMS messages to arbitrary phone numbers (costing money)
- Inject phishing content into the conversation flow
- Cause the agent to notify the business owner with fake emergency alerts

**Fix applied:** Added `validateTwilioSignature()` function using `twilio.validateRequest()` and updated `createTwilioWebhookHandler` to require `authToken` and `webhookUrl` parameters. Requests with invalid or missing signatures now receive a 403 response.

**Breaking change:** `createTwilioWebhookHandler` now requires a second `options` parameter with `authToken` and `webhookUrl`. Any code calling this function must be updated.

---

### CRITICAL-2: Airtable Formula Injection [FIXED]

**File:** `src/skills/airtable/index.ts` (lines 65, 125-128)
**Status:** Fixed

The `findCustomerByPhone` and `getJobs` methods interpolated user-controlled values directly into Airtable `filterByFormula` strings without escaping:

```typescript
filterByFormula: `{Phone} = "${phone}"`
```

If a phone number or date string contained double quotes or Airtable formula syntax, an attacker could break out of the string and inject arbitrary formula logic, potentially reading data from other fields or manipulating query results.

**Fix applied:** Added `escapeFormulaValue()` utility that escapes backslashes and double quotes before interpolation.

---

### HIGH-1: Error Logging Leaks Sensitive Information [PARTIALLY FIXED]

**File:** Multiple files across all skills
**Status:** Partially fixed (Twilio fixed, others need attention)

Error handlers throughout the codebase logged full error objects via `console.error`, which may contain:
- API keys embedded in request headers (axios config in error objects)
- Auth tokens in Twilio client errors
- Full request/response bodies with customer PII

**Twilio skill:** Fixed to log only `error.message` instead of the full error object.

**Still affected (needs fixing):**
- `src/skills/airtable/index.ts` - 7 error handlers log full error objects
- `src/skills/calendar/index.ts` - 6 error handlers log full error objects
- `src/skills/flexdesk/index.ts` - 14 error handlers log full error objects

**Recommendation:** Replace all `console.error('[Skill] msg:', error)` calls with the Logger class, logging only `error.message` for Error instances. The existing `Logger.error()` method already handles this correctly.

---

### HIGH-2: No Input Validation or Length Limits on Incoming SMS

**File:** `src/skills/twilio/index.ts` (`handleIncomingWebhook`), `src/core/agent.ts` (`handleIncomingMessage`)
**Status:** Not fixed (requires architectural decision)

Incoming SMS content (`body.Body`) is accepted without any validation:
- No maximum length enforcement
- No sanitization of control characters
- No rate limiting per phone number
- Content is stored as-is in JSON files on disk (memory system)

**Impact:**
- An attacker could send extremely long messages to exhaust disk space or memory
- Conversation history files grow unbounded per phone number
- No protection against SMS bombing (rapid repeated messages)

**Recommendation:**
1. Truncate incoming message body to a reasonable limit (e.g., 1600 chars, the SMS concatenation limit)
2. Add per-phone-number rate limiting (e.g., max 10 messages per minute)
3. Strip or escape control characters from message content before storage
4. Add a maximum conversation history size, archiving old messages automatically

---

### HIGH-3: Conversation Data Stored in Plaintext JSON Files

**File:** `src/core/memory.ts`
**Status:** Not fixed (architectural change needed)

The `MemorySystem` stores all customer conversations, extracted data (addresses, phone numbers, names), and customer records as plaintext JSON files in the `./data` directory. This includes PII and service history.

**Impact:**
- If the server is compromised, all customer data is immediately accessible
- No access controls on the data directory
- No encryption at rest
- No data retention policy - conversations accumulate indefinitely

**Recommendation:**
1. Use an encrypted database or encrypted file storage for customer data
2. Implement file-level encryption for the data directory at minimum
3. Add a data retention policy that automatically purges old conversations
4. Set restrictive file permissions on the data directory (0700)
5. Consider moving to the FlexDesk server database with proper RLS instead of local file storage

---

### MEDIUM-1: FlexDesk API Client Sends `withCredentials: true`

**File:** `src/skills/flexdesk/index.ts` (line 23)
**Status:** Not fixed

The axios client is configured with `withCredentials: true`, which causes the browser to include cookies with cross-origin requests. While this package runs server-side (not in a browser), this configuration is unnecessary and could be a security risk if the code were ever used in a browser context or if the axios instance were exposed.

**Recommendation:** Remove `withCredentials: true` since this is a server-side API client using Bearer token auth.

---

### MEDIUM-2: Debug Logging Exposes Full Message Content

**File:** `src/core/agent.ts` (line 100), `src/core/conversation.ts` (lines 38, 42-45)
**Status:** Not fixed

In debug mode, full message content including customer PII (addresses, phone numbers, service issues) is logged:

```typescript
this.logger.debug('Message content', { from, body });
this.logger.debug('Intent detected', { intent: context.intent, message: lastMessage.content });
```

**Recommendation:**
- Avoid logging full message content even in debug mode
- If debug logging is necessary, redact PII fields (phone, address)
- Ensure debug mode is never enabled in production

---

### LOW-1: No `.env` Validation at Startup

**File:** `src/index.ts`, `src/core/agent.ts`
**Status:** Not fixed

The agent boots without validating that required environment variables are present. Missing vars trigger runtime errors deep in the skill initialization code with unhelpful error messages. The package has `zod` as a dependency but does not use it for env validation.

**Recommendation:** Add a Zod schema to validate required environment variables at startup, similar to how the flexdesk-server now validates `JWT_SECRET` and other required vars. Fail fast with a clear error message listing which vars are missing.

---

## Positive Findings

1. **TwiML injection protection:** The `escapeXml()` function in `src/skills/twilio/index.ts` properly escapes XML special characters before embedding in TwiML `<Say>` tags. This was likely added during a previous review cycle.

2. **Path traversal prevention:** The `sanitizeFilename()` function in `src/core/memory.ts` strips all non-alphanumeric characters from filenames before constructing file paths, preventing directory traversal attacks via phone numbers.

3. **No hardcoded secrets:** All API keys and tokens are loaded from environment variables. The `.env.example` file contains only placeholder values. The root `.gitignore` properly excludes `.env` files.

4. **Credentials not committed:** No `.env` file exists in the package directory, only `.env.example`.

---

## Files Reviewed

| File | Lines | Issues |
|------|-------|--------|
| `src/index.ts` | 84 | LOW-1 |
| `src/core/agent.ts` | 211 | HIGH-2, MEDIUM-2 |
| `src/core/conversation.ts` | 305 | MEDIUM-2 |
| `src/core/memory.ts` | 254 | HIGH-3 |
| `src/core/scheduler.ts` | 221 | None |
| `src/core/logger.ts` | 101 | None |
| `src/core/debug-replay.ts` | 136 | None |
| `src/skills/twilio/index.ts` | 210 | CRITICAL-1, HIGH-1 |
| `src/skills/airtable/index.ts` | 248 | CRITICAL-2, HIGH-1 |
| `src/skills/calendar/index.ts` | 278 | HIGH-1 |
| `src/skills/flexdesk/index.ts` | 332 | HIGH-1, MEDIUM-1 |
| `src/templates/confirmations.ts` | 163 | None |
| `src/templates/daily-brief.ts` | 169 | None |
| `src/prompts/hvac/index.ts` | 181 | None |
| `src/prompts/plumbing/index.ts` | 108 | None |
| `src/types/index.ts` | 153 | None |
| `.env.example` | 31 | None |
| `package.json` | 42 | None |
