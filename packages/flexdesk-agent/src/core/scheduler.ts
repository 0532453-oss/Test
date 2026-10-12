/**
 * Scheduler
 *
 * Handles scheduled tasks like daily briefs, follow-up reminders,
 * and proactive outreach.
 */

import { AgentConfig } from '../types';
import { Logger } from './logger';

interface ScheduledTask {
  id: string;
  name: string;
  cronExpression: string;
  callback: () => void | Promise<void>;
  timer?: NodeJS.Timeout;
}

export class Scheduler {
  private config: AgentConfig;
  private tasks: Map<string, ScheduledTask> = new Map();
  private logger = new Logger('Scheduler');

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Schedule daily brief to be sent at specified time
   */
  scheduleDailyBrief(time: string, callback: () => void | Promise<void>): void {
    const [hours, minutes] = time.split(':').map(Number);

    const task: ScheduledTask = {
      id: 'daily-brief',
      name: 'Daily Brief',
      cronExpression: `${minutes} ${hours} * * *`,
      callback
    };

    this.scheduleDaily(task, hours, minutes);
    this.tasks.set(task.id, task);

    this.logger.info(`Daily brief scheduled for ${time}`);
  }

  /**
   * Schedule weekly report
   */
  scheduleWeeklyReport(
    dayOfWeek: number,
    time: string,
    callback: () => void | Promise<void>
  ): void {
    const [hours, minutes] = time.split(':').map(Number);

    const task: ScheduledTask = {
      id: 'weekly-report',
      name: 'Weekly Report',
      cronExpression: `${minutes} ${hours} * * ${dayOfWeek}`,
      callback
    };

    this.scheduleWeekly(task, dayOfWeek, hours, minutes);
    this.tasks.set(task.id, task);

    this.logger.info('Weekly report scheduled');
  }

  /**
   * Schedule a one-time reminder
   */
  scheduleReminder(
    id: string,
    at: Date,
    callback: () => void | Promise<void>
  ): void {
    const now = new Date();
    const delay = at.getTime() - now.getTime();

    if (delay <= 0) {
      this.logger.warn(`Reminder ${id} is in the past, skipping`);
      return;
    }

    const task: ScheduledTask = {
      id,
      name: `Reminder: ${id}`,
      cronExpression: '',
      callback,
      timer: setTimeout(async () => {
        try {
          await callback();
        } catch (error) {
          this.logger.error(`Error in reminder ${id}`, error);
        }
        this.tasks.delete(id);
      }, delay)
    };

    this.tasks.set(id, task);
    this.logger.info(`Reminder ${id} scheduled for ${at.toISOString()}`);
  }

  /**
   * Schedule follow-up for a conversation
   */
  scheduleFollowUp(
    customerPhone: string,
    delayHours: number,
    callback: () => void | Promise<void>
  ): void {
    const at = new Date(Date.now() + delayHours * 60 * 60 * 1000);
    this.scheduleReminder(`followup-${customerPhone}`, at, callback);
  }

  /**
   * Cancel a scheduled task
   */
  cancel(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task && task.timer) {
      clearTimeout(task.timer);
      clearInterval(task.timer);
      this.tasks.delete(taskId);
      this.logger.info(`Cancelled task: ${taskId}`);
      return true;
    }
    return false;
  }

  /**
   * Stop all scheduled tasks
   */
  stopAll(): void {
    for (const [id, task] of this.tasks) {
      if (task.timer) {
        clearTimeout(task.timer);
        clearInterval(task.timer);
      }
    }
    this.tasks.clear();
    this.logger.info('All tasks stopped');
  }

  /**
   * Get list of active tasks
   */
  getActiveTasks(): string[] {
    return Array.from(this.tasks.values()).map((t) => t.name);
  }

  private scheduleDaily(
    task: ScheduledTask,
    hours: number,
    minutes: number
  ): void {
    const runTask = async () => {
      try {
        await task.callback();
      } catch (error) {
        this.logger.error(`Error in ${task.name}`, error);
      }
    };

    // Calculate time until next run
    const now = new Date();
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    const delay = next.getTime() - now.getTime();

    // Schedule first run
    task.timer = setTimeout(() => {
      runTask();
      // Then schedule to run every 24 hours
      task.timer = setInterval(runTask, 24 * 60 * 60 * 1000);
    }, delay);
  }

  private scheduleWeekly(
    task: ScheduledTask,
    dayOfWeek: number,
    hours: number,
    minutes: number
  ): void {
    const runTask = async () => {
      try {
        await task.callback();
      } catch (error) {
        this.logger.error(`Error in ${task.name}`, error);
      }
    };

    // Calculate time until next run
    const now = new Date();
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);

    // Find next occurrence of dayOfWeek
    const daysUntil = (dayOfWeek - now.getDay() + 7) % 7 || 7;
    next.setDate(now.getDate() + daysUntil);

    if (next <= now) {
      next.setDate(next.getDate() + 7);
    }

    const delay = next.getTime() - now.getTime();

    // Schedule first run
    task.timer = setTimeout(() => {
      runTask();
      // Then schedule to run every 7 days
      task.timer = setInterval(runTask, 7 * 24 * 60 * 60 * 1000);
    }, delay);
  }
}
