// Core Types for FlexDesk Agent

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id: string;
  customerId: string;
  title: string;
  description: string;
  status: JobStatus;
  scheduledAt: Date;
  estimatedDuration: number; // minutes
  technicianId?: string;
  address: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type JobStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Booking {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  address: string;
  issue: string;
  scheduledAt: Date;
  notes?: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface DailyBrief {
  date: Date;
  newLeads: number;
  booked: number;
  needsFollowUp: number;
  schedule: Job[];
  weather?: WeatherInfo;
  reminders: string[];
}

export interface WeatherInfo {
  high: number;
  low: number;
  condition: string;
  icon: string;
}

export interface ConversationContext {
  customerId?: string;
  customerPhone: string;
  messages: Message[];
  intent?: ConversationIntent;
  extractedData: Partial<Booking>;
  status: ConversationStatus;
}

export interface Message {
  role: 'customer' | 'agent';
  content: string;
  timestamp: Date;
}

export type ConversationIntent =
  | 'book_service'
  | 'get_quote'
  | 'reschedule'
  | 'cancel'
  | 'question'
  | 'emergency'
  | 'unknown';

export type ConversationStatus =
  | 'active'
  | 'awaiting_response'
  | 'completed'
  | 'handed_off';

// Skill interfaces
export interface Skill {
  name: string;
  description: string;
  actions: Record<string, SkillAction>;
}

export type SkillAction = (...args: any[]) => Promise<any>;

// Configuration
export interface AgentConfig {
  name: string;
  businessName: string;
  businessPhone: string;
  timezone: string;
  industry: 'hvac' | 'plumbing' | 'electrical' | 'general';
  workingHours: {
    start: string; // "08:00"
    end: string;   // "17:00"
    days: number[]; // 0-6, Sunday = 0
  };
  emergencyEnabled: boolean;
  emergencyFee?: number;
  defaultJobDuration: number; // minutes
  confirmationTemplate: string;
  briefTime: string; // "07:00"
}

// Integration configs
export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken?: string;
}

export interface AirtableConfig {
  apiKey: string;
  baseId: string;
  customersTable: string;
  jobsTable: string;
}

export interface FlexDeskConfig {
  apiUrl: string;
  apiKey: string;
}
