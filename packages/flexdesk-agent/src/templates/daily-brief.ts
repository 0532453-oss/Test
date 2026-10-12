/**
 * Daily Brief Template
 *
 * Generates morning and evening briefs for business owners.
 */

import { Job, DailyBrief, WeatherInfo } from '../types';

export function generateMorningBrief(data: {
  businessName: string;
  agentName: string;
  date: Date;
  schedule: Job[];
  newLeadsYesterday: number;
  bookedYesterday: number;
  overdueInvoices: { count: number; total: number };
  weather?: WeatherInfo;
}): string {
  const dateStr = data.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  let brief = `Good morning! Here's your brief for ${dateStr}.\n\n`;

  // Weather
  if (data.weather) {
    brief += `**Weather:** ${data.weather.high}°F, ${data.weather.condition}\n\n`;
  }

  // Today's Schedule
  brief += `**Today's Schedule:** ${data.schedule.length} jobs\n`;
  if (data.schedule.length > 0) {
    for (const job of data.schedule) {
      const time = new Date(job.scheduledAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });
      brief += `• ${time} - ${job.title} at ${job.address}\n`;
    }
  } else {
    brief += `• No jobs scheduled yet\n`;
  }
  brief += '\n';

  // Yesterday's Activity
  brief += `**Yesterday's Activity:**\n`;
  brief += `• New leads: ${data.newLeadsYesterday}\n`;
  brief += `• Jobs booked: ${data.bookedYesterday}\n\n`;

  // Invoices
  if (data.overdueInvoices.count > 0) {
    brief += `**Action Needed:**\n`;
    brief += `• ${data.overdueInvoices.count} overdue invoices ($${data.overdueInvoices.total.toLocaleString()}) - reminders sent\n\n`;
  }

  brief += `Have a great day! - ${data.agentName}`;

  return brief;
}

export function generateEveningBrief(data: {
  agentName: string;
  date: Date;
  leadsToday: number;
  bookedToday: number;
  completedToday: number;
  revenue: number;
  tomorrowSchedule: Job[];
  followUpsNeeded: Array<{ name: string; phone: string; reason: string }>;
}): string {
  const dateStr = data.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  let brief = `**Daily Recap - ${dateStr}**\n\n`;

  // Today's Stats
  brief += `**Today's Activity:**\n`;
  brief += `• New leads: ${data.leadsToday}\n`;
  brief += `• Jobs booked: ${data.bookedToday}\n`;
  brief += `• Jobs completed: ${data.completedToday}\n`;
  if (data.revenue > 0) {
    brief += `• Revenue: $${data.revenue.toLocaleString()}\n`;
  }
  brief += '\n';

  // Tomorrow's Schedule
  brief += `**Tomorrow's Schedule:** ${data.tomorrowSchedule.length} jobs\n`;
  if (data.tomorrowSchedule.length > 0) {
    for (const job of data.tomorrowSchedule.slice(0, 5)) {
      const time = new Date(job.scheduledAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });
      brief += `• ${time} - ${job.title}\n`;
    }
    if (data.tomorrowSchedule.length > 5) {
      brief += `• ... and ${data.tomorrowSchedule.length - 5} more\n`;
    }
  }
  brief += '\n';

  // Follow-ups
  if (data.followUpsNeeded.length > 0) {
    brief += `**Follow-ups Needed:**\n`;
    for (const followUp of data.followUpsNeeded.slice(0, 3)) {
      brief += `• ${followUp.name} - ${followUp.reason}\n`;
    }
    brief += '\n';
  }

  brief += `See you tomorrow! - ${data.agentName}`;

  return brief;
}

export function generateWeeklyReport(data: {
  agentName: string;
  weekOf: Date;
  totalLeads: number;
  totalBooked: number;
  conversionRate: number;
  jobsCompleted: number;
  revenue: number;
  topIssues: Array<{ issue: string; count: number }>;
  overdueInvoices: { count: number; total: number };
  customerSatisfaction?: number;
}): string {
  const weekStr = data.weekOf.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric'
  });

  let report = `**Weekly Report - Week of ${weekStr}**\n\n`;

  // Lead Summary
  report += `**Lead Summary:**\n`;
  report += `• Total leads: ${data.totalLeads}\n`;
  report += `• Jobs booked: ${data.totalBooked}\n`;
  report += `• Conversion rate: ${data.conversionRate}%\n\n`;

  // Revenue
  report += `**Revenue:**\n`;
  report += `• Jobs completed: ${data.jobsCompleted}\n`;
  report += `• Total revenue: $${data.revenue.toLocaleString()}\n\n`;

  // Top Issues
  if (data.topIssues.length > 0) {
    report += `**Top Service Requests:**\n`;
    for (const issue of data.topIssues.slice(0, 5)) {
      report += `• ${issue.issue}: ${issue.count} calls\n`;
    }
    report += '\n';
  }

  // Outstanding
  if (data.overdueInvoices.count > 0) {
    report += `**Outstanding:**\n`;
    report += `• ${data.overdueInvoices.count} overdue invoices: $${data.overdueInvoices.total.toLocaleString()}\n\n`;
  }

  report += `Have a great week ahead! - ${data.agentName}`;

  return report;
}
