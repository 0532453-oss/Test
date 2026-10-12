# FlexDesk AI Agent Strategy

## Executive Summary

Build a 24/7 AI agent for small service businesses (HVAC, plumbing, electrical) powered by OpenClaw. Sell standalone first for fast revenue, then upgrade customers to FlexDesk CRM bundle for higher LTV and stickiness.

**Opportunity:** OpenClaw just launched. 99% of market unaware. 6-12 month window before competition.

**Target:** $50K MRR within 12 months.

---

## Product Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRODUCT STACK                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐      ┌─────────────────────┐          │
│  │   STANDALONE        │      │   FLEXDESK          │          │
│  │   AI AGENT          │      │   CRM               │          │
│  │                     │      │                     │          │
│  │   Powered by        │      │   Proprietary       │          │
│  │   OpenClaw          │      │   software          │          │
│  │                     │      │                     │          │
│  │   $297-497/mo       │      │   $99/mo            │          │
│  └──────────┬──────────┘      └──────────┬──────────┘          │
│             │                            │                      │
│             └──────────┬─────────────────┘                      │
│                        │                                        │
│                        ▼                                        │
│             ┌─────────────────────┐                             │
│             │   BUNDLE            │                             │
│             │   FlexDesk + AI     │                             │
│             │   $397-597/mo       │                             │
│             └─────────────────────┘                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## What OpenClaw Provides (Free/Open Source)

| Component | Function |
|-----------|----------|
| Agent framework | 24/7 autonomous operation |
| Computer control | Can use any software |
| Memory system | Remembers everything, learns over time |
| Messaging channels | Telegram, iMessage, WhatsApp, Discord |
| Skills system | Extensible functionality |
| Local gateway | Runs on VPS or Mac Mini |

**Cost:** $0 (open source) + AI model ($200/mo Claude Max shared across customers)

---

## What We Build On Top

| Component | Function | Location |
|-----------|----------|----------|
| HVAC-specific prompts | Industry knowledge, scripts | OpenClaw config |
| Booking flow logic | Schedule appointments | OpenClaw skill |
| Twilio integration | SMS/call handling | OpenClaw skill |
| Call transcription | Otter/Whisper pipeline | Custom code |
| CRM connector | Syncs to FlexDesk or Airtable | OpenClaw skill |
| Daily/weekly reports | Formatted briefs | OpenClaw skill |
| Customer onboarding | Setup wizard | Admin dashboard |
| Billing/admin | Stripe, customer management | Admin dashboard |

---

## Pricing Structure

| Tier | Monthly | Included |
|------|---------|----------|
| FlexDesk Solo | $99 | CRM, scheduling, invoicing, mobile app |
| Standalone AI Agent | $397 | AI agent only (uses customer's existing tools) |
| FlexDesk + AI Bundle | $497 | Everything integrated |
| FlexDesk Pro | $697 | Bundle + call transcription, proactive outreach, review generation |

**Annual discount:** 2 months free

---

## Unit Economics

### Standalone AI Agent (OpenClaw)

| Item | Monthly Cost |
|------|--------------|
| AI Model (Claude Max share) | $10-15 |
| Hosting (VPS share) | $2-5 |
| Phone/SMS (Twilio) | $20-30 |
| Call Transcription | $8 |
| Support time | $10-20 |
| **Total Cost** | **$50-80** |
| **Price** | **$397** |
| **Profit** | **$317-347** |
| **Margin** | **80-87%** |

### FlexDesk + AI Bundle

| Item | Monthly Cost |
|------|--------------|
| All standalone costs | $50-80 |
| FlexDesk hosting | $10 |
| **Total Cost** | **$60-90** |
| **Price** | **$497** |
| **Profit** | **$407-437** |
| **Margin** | **82-88%** |

---

## Scaling Revenue

| Customers | Monthly Revenue | Monthly Cost | Monthly Profit | Annual Profit |
|-----------|-----------------|--------------|----------------|---------------|
| 5 | $2,485 | $350 | $2,135 | $25,620 |
| 10 | $4,970 | $700 | $4,270 | $51,240 |
| 20 | $9,940 | $1,400 | $8,540 | $102,480 |
| 50 | $24,850 | $3,500 | $21,350 | $256,200 |
| 100 | $49,700 | $7,000 | $42,700 | $512,400 |

---

## Target Customer Profile

**Ideal Customer:**
- 1-10 employee service business
- HVAC, plumbing, electrical, landscaping, cleaning
- Owner is also technician (or small team)
- Currently using paper, spreadsheets, or basic tools
- Losing money to missed calls and disorganization

**Signals They're Ready:**
- Bad Google reviews mentioning "hard to reach"
- No online booking
- Outdated website or just Facebook page
- In business 2+ years (has customers to manage)

---

## How the AI Agent Works

### Customer Texts Business Number

**Customer:** "AC stopped blowing cold air. Can someone come today?"

**AI Agent (30 seconds):**
> "Sorry to hear that - we'll get you taken care of. A few quick questions:
> 1. What's your zip code?
> 2. What brand/model is your unit if you know it?
> 3. Is it not cooling at all or just weak airflow?"

**Customer:** "85281. Not sure the brand. It's blowing but not cold."

**AI Agent:**
> "Got it. That's usually a refrigerant or compressor issue. We have availability today at 4 PM or tomorrow at 9 AM. Which works better?"

**Customer:** "Today at 4"

**AI Agent:**
> "Done. I've got you down for 4 PM today. What's the address?"

[Books appointment, updates calendar, notifies owner]

### Owner Receives

> "New booking:
> - Customer: (480) 555-1234
> - Address: 1847 Oak Street, 85281
> - Time: Today 4 PM
> - Issue: AC blowing but not cold - likely refrigerant/compressor
> - Added to your calendar"

### End of Day Report

> **Daily Recap:**
>
> **New leads today:** 6
> - 4 booked
> - 1 quote request (call tomorrow)
> - 1 outside service area (referred out)
>
> **Tomorrow's schedule:**
> - 8 AM: Tune-up, 2901 Elm
> - 10 AM: No cool, 445 Pine
> - 1 PM: Thermostat install, 3820 Maple
>
> **Outstanding invoices:** 3 ($2,400) - reminders sent

---

## Call Transcription Flow

1. Owner answers call on job site
2. Call recorded via app (Otter, Fireflies, or VoIP)
3. Transcript sent to AI agent
4. Agent extracts: customer info, issue, appointment time
5. Agent updates: CRM, calendar, sends confirmation
6. Owner gets summary notification

**Result:** Owner talks naturally, all admin work automated.

---

## Standalone vs Bundle

### Standalone (OpenClaw Only)

Customer keeps existing tools:
- Google Calendar
- Airtable (simple CRM)
- Their phone

AI Agent:
- Handles texts/calls via Twilio
- Books to Google Calendar
- Logs to Airtable
- Sends briefs via Telegram

### Bundle (OpenClaw + FlexDesk)

Customer uses FlexDesk:
- Full CRM
- Scheduling
- Invoicing
- Mobile app

AI Agent:
- Writes directly to FlexDesk API
- Native integration
- Single source of truth

---

## Technical Implementation

### Package Structure

```
packages/
  flexdesk-agent/           <-- NEW PACKAGE
    src/
      core/                 # OpenClaw wrapper
      skills/
        twilio/             # SMS/call handling
        calendar/           # Google/Outlook
        airtable/           # Standalone CRM
        flexdesk/           # FlexDesk integration
      prompts/
        hvac/               # HVAC-specific
        plumbing/           # Plumbing-specific
      templates/
        daily-brief.ts
        weekly-report.ts
```

### FlexDesk Skill

```typescript
// packages/flexdesk-agent/src/skills/flexdesk.ts

export const flexdeskSkill = {
  name: 'flexdesk',

  actions: {
    createCustomer: async (data) => {
      return await flexdeskApi.post('/customers', data);
    },

    createJob: async (data) => {
      return await flexdeskApi.post('/jobs', data);
    },

    getSchedule: async (date) => {
      return await flexdeskApi.get('/jobs', { params: { date } });
    },

    createInvoice: async (jobId) => {
      return await flexdeskApi.post('/invoices', { jobId });
    },

    sendInvoice: async (invoiceId) => {
      return await flexdeskApi.post(`/invoices/${invoiceId}/send`);
    }
  }
};
```

---

## Sales Playbook

### The Pitch

> "What if you had a full-time receptionist, dispatcher, and office manager who works 24/7, never takes a day off, and costs less than one part-time employee?"

### Cold Call Script

> "Hey, this is [Name] - I help HVAC companies stop losing jobs to missed calls. Quick question: when you're on a roof and the phone rings, what happens to that call?"

*Let them talk.*

> "Yeah, that's exactly what I'm hearing. We built something that handles those calls automatically - books the job, updates your schedule, texts you the details. Would you be open to a 15-minute demo?"

### Demo Flow

1. Text the demo agent live on your phone
2. Show instant response and booking flow
3. Show calendar update and owner notification
4. Show morning brief and daily report
5. Quick FlexDesk CRM walkthrough
6. Close: "One extra job pays for this. What do you want to do?"

### Objection Handling

**"That's expensive."**
> "What's one missed job cost you? $300? $500? This pays for itself with one extra booking."

**"I need to think about it."**
> "What specifically? Let me address it now."

**"I'm not tech savvy."**
> "You just text like you're texting an employee. No apps to learn."

**"Can I try it first?"**
> "2 weeks free. If you don't book 5 extra jobs, pay nothing."

---

## Go-To-Market Timeline

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up OpenClaw on VPS
- [ ] Build HVAC prompts and booking flow
- [ ] Integrate Twilio for SMS
- [ ] Connect to Airtable (standalone)
- [ ] Test with one free customer

### Phase 2: Launch Standalone (Weeks 3-4)
- [ ] Build simple admin dashboard
- [ ] Set up Stripe billing
- [ ] Create demo environment
- [ ] Start cold outreach
- [ ] Get 5 paying customers

### Phase 3: FlexDesk Integration (Weeks 5-8)
- [ ] Build FlexDesk skill for OpenClaw
- [ ] Connect to FlexDesk API
- [ ] Test full bundle flow
- [ ] Upgrade standalone customers

### Phase 4: Scale (Months 3-6)
- [ ] Systematize onboarding
- [ ] Build referral program
- [ ] Expand to plumbing, electrical
- [ ] Target 50 customers

---

## Revenue Targets

| Milestone | Customers | MRR | Timeline |
|-----------|-----------|-----|----------|
| First paying customer | 1 | $397 | Week 4 |
| Break-even | 5 | $2,000 | Week 8 |
| $5K MRR | 12 | $5,000 | Month 3 |
| $10K MRR | 25 | $10,000 | Month 6 |
| $25K MRR | 60 | $25,000 | Month 9 |
| $50K MRR | 120 | $50,000 | Month 12 |

---

## Competitive Moat

1. **Customer lock-in** - Agent memory makes switching painful
2. **Vertical expertise** - HVAC-specific knowledge compounds
3. **Case studies** - Real results can't be faked
4. **Referral network** - HVAC owners know each other
5. **FlexDesk integration** - All-in-one stickiness
6. **First mover** - 6-12 month head start

---

## Expansion Path

- **Year 1:** HVAC only, prove the model
- **Year 2:** Plumbing, electrical (same customer profile)
- **Year 3:** All home services
- **Year 4:** Other local services (auto, dental, legal)

---

## Exit Scenarios

| Path | Outcome |
|------|---------|
| Lifestyle | $200-400K/year profit |
| Scale | $1-5M/year agency |
| SaaS | Productize, raise funding |
| Acquisition | Sell to ServiceTitan, Housecall Pro, PE |
| Franchise | License to operators in other markets |

**100 customers at $500/mo = $600K ARR = $1.5-3M valuation**

---

## Startup Costs

| Item | Cost |
|------|------|
| VPS hosting | $50/month |
| Claude Max | $200/month |
| Twilio | $20 initial |
| Domain/website | $50 |
| Total to start | ~$320 |

---

## Key Links

- OpenClaw: https://claw.bot
- FlexDesk repo: `C:\Users\paulo\Desktop\Repositories\FlexDesk`
- FlexDesk API: `packages/flexdesk-server`
- New package location: `packages/flexdesk-agent`

---

## Next Steps

1. [ ] Install OpenClaw on test VPS
2. [ ] Build basic HVAC booking skill
3. [ ] Find first free test customer
4. [ ] Document results
5. [ ] Start selling

---

*Created: February 2025*
*Last Updated: February 2025*
