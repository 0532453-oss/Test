/**
 * HVAC Industry Prompts
 *
 * Specialized prompts and knowledge for HVAC businesses.
 */

export const hvacSystemPrompt = `You are a helpful AI assistant for an HVAC company. You help customers schedule service appointments, answer questions about HVAC issues, and provide basic troubleshooting guidance.

## Your Personality
- Friendly and professional
- Knowledgeable about HVAC systems
- Patient with customers who aren't technical
- Focused on getting them help quickly

## Common Issues You Can Identify
- AC not cooling (refrigerant, compressor, frozen coils)
- AC not turning on (thermostat, breaker, capacitor)
- Strange noises (fan motor, loose parts, compressor)
- Bad smells (mold, burning, refrigerant leak)
- Uneven cooling (ductwork, airflow, zoning)
- High energy bills (efficiency, maintenance needed)
- Heating not working (furnace, heat pump, thermostat)

## Your Goals
1. Understand the customer's issue
2. Get their location and contact info
3. Check availability and book an appointment
4. Provide helpful tips if appropriate
5. Set expectations for the service call

## What NOT To Do
- Don't give specific repair quotes (technician will assess on-site)
- Don't diagnose complex issues definitively
- Don't recommend DIY repairs for anything involving refrigerant or electrical
- Don't make promises about repair costs

## Emergency Situations
Prioritize these as emergencies:
- Gas smell (tell them to leave and call gas company first)
- No heat when below freezing with elderly/children
- No AC when over 100°F with elderly/children
- Visible sparks or electrical issues
- Carbon monoxide detector going off
`;

export const hvacCommonIssues = {
  'ac_not_cooling': {
    symptoms: ['not cold', 'warm air', 'not cooling', 'no cold air'],
    likely_causes: ['Low refrigerant', 'Dirty coils', 'Compressor issue', 'Frozen evaporator'],
    urgency: 'medium',
    estimated_duration: 60,
    questions: [
      'Is air blowing from the vents, just not cold?',
      'When did you first notice this?',
      'Is the outdoor unit running?'
    ]
  },

  'ac_not_running': {
    symptoms: ['won\'t turn on', 'not running', 'nothing happens', 'dead'],
    likely_causes: ['Thermostat issue', 'Tripped breaker', 'Capacitor failure', 'Contactor issue'],
    urgency: 'medium',
    estimated_duration: 45,
    questions: [
      'Have you checked the thermostat batteries?',
      'Is the breaker tripped?',
      'Do you hear any clicking when it tries to start?'
    ]
  },

  'strange_noise': {
    symptoms: ['grinding', 'squealing', 'banging', 'rattling', 'buzzing', 'humming'],
    likely_causes: ['Fan motor bearing', 'Loose parts', 'Compressor issue', 'Debris'],
    urgency: 'medium',
    estimated_duration: 60,
    questions: [
      'Where does the noise come from - inside or outside unit?',
      'Is it constant or intermittent?',
      'When did it start?'
    ]
  },

  'bad_smell': {
    symptoms: ['smell', 'odor', 'stink', 'musty', 'burning', 'rotten'],
    likely_causes: ['Mold in ducts', 'Electrical issue', 'Dead animal', 'Dirty filter'],
    urgency: 'high',
    estimated_duration: 60,
    questions: [
      'What does it smell like - musty, burning, or chemical?',
      'Does it happen only when the AC runs?',
      'When did you first notice it?'
    ]
  },

  'no_heat': {
    symptoms: ['no heat', 'not heating', 'cold air from heater', 'furnace not working'],
    likely_causes: ['Ignitor failure', 'Gas valve', 'Thermostat', 'Flame sensor'],
    urgency: 'high',
    estimated_duration: 60,
    questions: [
      'Is the thermostat set to heat?',
      'Do you hear the furnace trying to start?',
      'When was it last serviced?'
    ]
  },

  'thermostat_issue': {
    symptoms: ['thermostat', 'temperature wrong', 'won\'t hold temperature', 'display blank'],
    likely_causes: ['Bad thermostat', 'Wiring issue', 'Calibration', 'Dead batteries'],
    urgency: 'low',
    estimated_duration: 30,
    questions: [
      'Is the display showing anything?',
      'Have you replaced the batteries recently?',
      'Is it programmable or smart?'
    ]
  },

  'water_leak': {
    symptoms: ['leaking', 'water', 'dripping', 'puddle', 'condensation'],
    likely_causes: ['Clogged drain line', 'Frozen coils', 'Cracked pan', 'Improper installation'],
    urgency: 'high',
    estimated_duration: 45,
    questions: [
      'Where is the water coming from?',
      'How much water - a little or a lot?',
      'Is it near the indoor or outdoor unit?'
    ]
  },

  'high_bills': {
    symptoms: ['high bill', 'expensive', 'energy costs', 'runs constantly'],
    likely_causes: ['Low efficiency', 'Refrigerant leak', 'Dirty system', 'Duct leaks'],
    urgency: 'low',
    estimated_duration: 90,
    questions: [
      'When was the system last serviced?',
      'How old is your system?',
      'Have you noticed any other issues?'
    ]
  }
};

export const hvacQuickResponses = {
  service_areas: (areas: string[]) =>
    `We service ${areas.join(', ')} and surrounding areas.`,

  operating_hours: (hours: string) =>
    `We're available ${hours}. For after-hours emergencies, we offer 24/7 service with an emergency call-out fee.`,

  payment_methods: () =>
    `We accept all major credit cards, cash, and check. Financing options are available for larger repairs or replacements.`,

  warranty_question: () =>
    `We provide a 1-year warranty on all repairs. New system installations come with manufacturer warranties ranging from 5-10 years on parts.`,

  how_long_repair: () =>
    `Most repairs are completed in one visit, typically 1-2 hours. If parts need to be ordered, we'll schedule a follow-up as quickly as possible.`,

  maintenance_recommendation: () =>
    `We recommend servicing your AC in spring and your heating system in fall. Regular maintenance helps prevent breakdowns and extends the life of your system.`
};

export function detectHvacIssue(message: string): string | null {
  const lower = message.toLowerCase();

  for (const [issueKey, issue] of Object.entries(hvacCommonIssues)) {
    for (const symptom of issue.symptoms) {
      if (lower.includes(symptom)) {
        return issueKey;
      }
    }
  }

  return null;
}

export function getIssueDetails(issueKey: string) {
  return hvacCommonIssues[issueKey as keyof typeof hvacCommonIssues];
}
