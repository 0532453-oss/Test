/**
 * Plumbing Industry Prompts
 *
 * Specialized prompts and knowledge for plumbing businesses.
 * Template for future expansion.
 */

export const plumbingSystemPrompt = `You are a helpful AI assistant for a plumbing company. You help customers schedule service appointments, answer questions about plumbing issues, and provide basic guidance.

## Your Personality
- Friendly and professional
- Knowledgeable about plumbing systems
- Calm during emergencies (leaks, floods)
- Focused on getting them help quickly

## Common Issues You Can Identify
- Clogged drains (sink, toilet, main line)
- Leaking pipes (visible, under slab, in walls)
- Water heater problems (no hot water, leaking, noises)
- Toilet issues (running, clogged, leaking at base)
- Low water pressure
- Sewer backup
- Garbage disposal problems

## Emergency Situations
Prioritize these as emergencies:
- Active flooding/major leak
- Sewage backup into home
- No water at all
- Gas smell near water heater
- Burst pipe
`;

export const plumbingCommonIssues = {
  'clogged_drain': {
    symptoms: ['clogged', 'slow drain', 'backed up', 'won\'t drain'],
    likely_causes: ['Hair/debris', 'Grease buildup', 'Tree roots', 'Main line issue'],
    urgency: 'medium',
    estimated_duration: 45,
    questions: [
      'Which drain is affected?',
      'Is it completely blocked or just slow?',
      'Have you tried a plunger or drain cleaner?'
    ]
  },

  'leak': {
    symptoms: ['leaking', 'dripping', 'water damage', 'wet spot'],
    likely_causes: ['Pipe joint failure', 'Corrosion', 'High pressure', 'Frozen pipe'],
    urgency: 'high',
    estimated_duration: 60,
    questions: [
      'Where is the leak coming from?',
      'How much water - drip or spray?',
      'Can you turn off the water supply to that area?'
    ]
  },

  'water_heater': {
    symptoms: ['no hot water', 'water heater', 'lukewarm', 'water not hot enough'],
    likely_causes: ['Heating element', 'Thermostat', 'Sediment buildup', 'Age'],
    urgency: 'medium',
    estimated_duration: 60,
    questions: [
      'Is it gas or electric?',
      'Do you have any hot water or none at all?',
      'How old is the water heater?'
    ]
  },

  'toilet_problem': {
    symptoms: ['toilet', 'running toilet', 'toilet clogged', 'toilet leaking'],
    likely_causes: ['Flapper valve', 'Fill valve', 'Clog', 'Wax ring'],
    urgency: 'medium',
    estimated_duration: 30,
    questions: [
      'Is it clogged, running, or leaking?',
      'If leaking, where - at the base or in the tank?',
      'Have you tried plunging?'
    ]
  },

  'sewer_backup': {
    symptoms: ['sewer', 'sewage', 'backup', 'multiple drains', 'bad smell from drains'],
    likely_causes: ['Main line clog', 'Tree roots', 'Collapsed pipe', 'Belly in line'],
    urgency: 'emergency',
    estimated_duration: 120,
    questions: [
      'Are multiple drains affected?',
      'Is there sewage coming up into the home?',
      'Do you have a basement or ground floor issue?'
    ]
  }
};

export function detectPlumbingIssue(message: string): string | null {
  const lower = message.toLowerCase();

  for (const [issueKey, issue] of Object.entries(plumbingCommonIssues)) {
    for (const symptom of issue.symptoms) {
      if (lower.includes(symptom)) {
        return issueKey;
      }
    }
  }

  return null;
}
