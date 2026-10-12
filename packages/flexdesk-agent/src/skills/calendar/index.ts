/**
 * Calendar Skill
 *
 * Manages appointments via Google Calendar or Outlook.
 */

import { GoogleCalendarConfig, TimeSlot } from '../../types';

interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  start: Date;
  duration: number; // minutes
  location?: string;
}

export class CalendarSkill {
  private config: GoogleCalendarConfig;
  private calendar: any; // Google Calendar API client

  constructor(config: GoogleCalendarConfig) {
    this.config = config;
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    try {
      const { google } = require('googleapis');

      const oauth2Client = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        this.config.redirectUri
      );

      if (this.config.refreshToken) {
        oauth2Client.setCredentials({
          refresh_token: this.config.refreshToken
        });
      }

      this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      console.log('[CalendarSkill] Client initialized');
    } catch (error) {
      console.error('[CalendarSkill] Failed to initialize:', error);
    }
  }

  /**
   * Create a calendar event
   */
  async createEvent(event: CalendarEvent): Promise<string | null> {
    if (!this.calendar) {
      console.error('[CalendarSkill] Calendar not initialized');
      return null;
    }

    try {
      const endTime = new Date(event.start);
      endTime.setMinutes(endTime.getMinutes() + event.duration);

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: event.title,
          description: event.description,
          location: event.location,
          start: {
            dateTime: event.start.toISOString()
          },
          end: {
            dateTime: endTime.toISOString()
          }
        }
      });

      console.log(`[CalendarSkill] Event created: ${response.data.id}`);
      return response.data.id;
    } catch (error) {
      console.error('[CalendarSkill] Failed to create event:', error);
      return null;
    }
  }

  /**
   * Get available time slots for a date
   */
  async getAvailableSlots(
    date: Date,
    duration: number = 60,
    workingHours: { start: string; end: string } = {
      start: '08:00',
      end: '17:00'
    }
  ): Promise<TimeSlot[]> {
    if (!this.calendar) {
      return [];
    }

    try {
      // Get start and end of the day
      const dayStart = new Date(date);
      const [startHour, startMin] = workingHours.start.split(':').map(Number);
      dayStart.setHours(startHour, startMin, 0, 0);

      const dayEnd = new Date(date);
      const [endHour, endMin] = workingHours.end.split(':').map(Number);
      dayEnd.setHours(endHour, endMin, 0, 0);

      // Get existing events
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: dayStart.toISOString(),
        timeMax: dayEnd.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events = response.data.items || [];
      const busySlots = events.map((e: any) => ({
        start: new Date(e.start.dateTime || e.start.date),
        end: new Date(e.end.dateTime || e.end.date)
      }));

      // Generate available slots
      const slots: TimeSlot[] = [];
      let current = new Date(dayStart);

      while (current < dayEnd) {
        const slotEnd = new Date(current);
        slotEnd.setMinutes(slotEnd.getMinutes() + duration);

        if (slotEnd > dayEnd) break;

        // Check if slot conflicts with any busy period
        const isAvailable = !busySlots.some(
          (busy: { start: Date; end: Date }) =>
            (current >= busy.start && current < busy.end) ||
            (slotEnd > busy.start && slotEnd <= busy.end) ||
            (current <= busy.start && slotEnd >= busy.end)
        );

        slots.push({
          start: new Date(current),
          end: new Date(slotEnd),
          available: isAvailable
        });

        // Move to next slot (every 30 minutes)
        current.setMinutes(current.getMinutes() + 30);
      }

      return slots;
    } catch (error) {
      console.error('[CalendarSkill] Failed to get slots:', error);
      return [];
    }
  }

  /**
   * Get events for a date range
   */
  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    if (!this.calendar) {
      return [];
    }

    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      return (response.data.items || []).map((e: any) => ({
        id: e.id,
        title: e.summary,
        description: e.description,
        start: new Date(e.start.dateTime || e.start.date),
        duration: Math.round(
          (new Date(e.end.dateTime || e.end.date).getTime() -
            new Date(e.start.dateTime || e.start.date).getTime()) /
            60000
        ),
        location: e.location
      }));
    } catch (error) {
      console.error('[CalendarSkill] Failed to get events:', error);
      return [];
    }
  }

  /**
   * Update an event
   */
  async updateEvent(
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<boolean> {
    if (!this.calendar) {
      return false;
    }

    try {
      const requestBody: any = {};

      if (updates.title) requestBody.summary = updates.title;
      if (updates.description) requestBody.description = updates.description;
      if (updates.location) requestBody.location = updates.location;
      if (updates.start) {
        requestBody.start = { dateTime: updates.start.toISOString() };
        if (updates.duration) {
          const endTime = new Date(updates.start);
          endTime.setMinutes(endTime.getMinutes() + updates.duration);
          requestBody.end = { dateTime: endTime.toISOString() };
        }
      }

      await this.calendar.events.patch({
        calendarId: 'primary',
        eventId,
        requestBody
      });

      return true;
    } catch (error) {
      console.error('[CalendarSkill] Failed to update event:', error);
      return false;
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    if (!this.calendar) {
      return false;
    }

    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId
      });
      return true;
    } catch (error) {
      console.error('[CalendarSkill] Failed to delete event:', error);
      return false;
    }
  }

  /**
   * Get next available slot
   */
  async getNextAvailable(
    duration: number = 60,
    daysToCheck: number = 7
  ): Promise<TimeSlot | null> {
    const today = new Date();

    for (let i = 0; i < daysToCheck; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      const slots = await this.getAvailableSlots(date, duration);
      const available = slots.find((s) => s.available);

      if (available) {
        return available;
      }
    }

    return null;
  }
}
