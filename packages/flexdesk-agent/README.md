# FlexDesk Agent

24/7 AI Agent for service businesses - powered by OpenClaw.

## Overview

FlexDesk Agent is an AI-powered virtual receptionist and dispatcher for home service businesses (HVAC, plumbing, electrical, etc.). It handles customer inquiries via SMS, books appointments, and keeps your CRM updated - all automatically.

## Features

- **24/7 SMS Handling**: Responds to customer texts instantly
- **Smart Booking**: Understands customer issues and schedules appointments
- **Calendar Integration**: Syncs with Google Calendar or Outlook
- **CRM Integration**: Works with Airtable (standalone) or FlexDesk (bundle)
- **Daily Briefs**: Morning and evening summaries sent to your phone
- **Industry Knowledge**: Pre-built prompts for HVAC, plumbing, and more
- **Memory System**: Remembers customers and conversation history

## Quick Start

### 1. Install Dependencies

```bash
cd packages/flexdesk-agent
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Required API Keys

- **Claude API** or **OpenAI API** (for AI responses)
- **Twilio** (for SMS handling)
- **Google Calendar** (optional, for calendar integration)
- **Airtable** or **FlexDesk API** (for CRM)

### 4. Run the Agent

```bash
pnpm start
```

## Architecture

```
src/
├── core/
│   ├── agent.ts          # Main agent orchestrator
│   ├── conversation.ts   # Conversation flow handler
│   ├── scheduler.ts      # Scheduled tasks (briefs, reminders)
│   └── memory.ts         # Persistent memory system
├── skills/
│   ├── twilio/           # SMS/voice handling
│   ├── calendar/         # Google Calendar integration
│   ├── airtable/         # Standalone CRM
│   └── flexdesk/         # FlexDesk CRM integration
├── prompts/
│   ├── hvac/             # HVAC-specific knowledge
│   └── plumbing/         # Plumbing-specific knowledge
├── templates/
│   ├── daily-brief.ts    # Brief message templates
│   └── confirmations.ts  # Customer message templates
└── types/
    └── index.ts          # TypeScript type definitions
```

## Configuration

### Agent Configuration

```typescript
const agent = new FlexDeskAgent({
  name: 'Dispatch',              // Agent's name
  businessName: 'Your HVAC Co',  // Your business name
  businessPhone: '+1234567890',  // Main business phone
  timezone: 'America/Phoenix',   // Your timezone
  industry: 'hvac',              // hvac, plumbing, electrical, general
  workingHours: {
    start: '08:00',
    end: '17:00',
    days: [1, 2, 3, 4, 5]        // Mon-Fri
  },
  emergencyEnabled: true,
  emergencyFee: 250,
  defaultJobDuration: 60,        // minutes
  briefTime: '07:00'             // When to send morning brief
});
```

### Twilio Setup

1. Create a Twilio account at https://twilio.com
2. Get a phone number with SMS capabilities
3. Set your webhook URL to receive incoming messages
4. Add credentials to `.env`

### Google Calendar Setup

1. Create a Google Cloud project
2. Enable the Calendar API
3. Create OAuth credentials
4. Add credentials to `.env`
5. Complete OAuth flow to get refresh token

## Usage

### Standalone Mode (Airtable)

Uses Airtable as a simple CRM. Good for getting started.

```env
AIRTABLE_API_KEY=your_key
AIRTABLE_BASE_ID=your_base_id
```

### Bundle Mode (FlexDesk)

Full integration with FlexDesk CRM for customers, jobs, estimates, and invoices.

```env
FLEXDESK_API_URL=http://localhost:3001/api/v1
FLEXDESK_API_KEY=your_api_key
```

## Customization

### Adding Industry Knowledge

Create a new folder in `src/prompts/` with:
- System prompt
- Common issues dictionary
- Quick responses

See `src/prompts/hvac/index.ts` for an example.

### Custom Message Templates

Edit `src/templates/confirmations.ts` to customize:
- Appointment confirmations
- Reminder messages
- Follow-up texts
- Invoice reminders

## Deployment

### VPS Deployment

```bash
# On your server
git clone your-repo
cd flexdesk/packages/flexdesk-agent
pnpm install
pnpm build

# Run with PM2
pm2 start dist/index.js --name flexdesk-agent
```

### Environment Variables for Production

```env
NODE_ENV=production
# ... all other env vars
```

## Pricing Model

When selling this as a service:

| Tier | Price | Features |
|------|-------|----------|
| Basic | $297/mo | SMS handling, booking, calendar |
| Standard | $497/mo | + Call transcription, CRM, reports |
| Premium | $697/mo | + Proactive outreach, review requests |

## License

Proprietary - FlexDesk

## Support

For issues and feature requests, contact the development team.
