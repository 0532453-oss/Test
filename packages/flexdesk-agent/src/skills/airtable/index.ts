/**
 * Airtable Skill
 *
 * Simple CRM for standalone mode using Airtable as the database.
 */

import { AirtableConfig, Customer, Job, Booking } from '../../types';

/**
 * Escape a string value for use in Airtable filterByFormula to prevent formula injection.
 * Doubles any embedded double-quote characters so the value is safely quoted.
 */
function escapeFormulaValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export class AirtableSkill {
  private config: AirtableConfig;
  private base: any; // Airtable base

  constructor(config: AirtableConfig) {
    this.config = config;
    this.initializeClient();
  }

  private initializeClient(): void {
    try {
      const Airtable = require('airtable');
      Airtable.configure({ apiKey: this.config.apiKey });
      this.base = Airtable.base(this.config.baseId);
      console.log('[AirtableSkill] Client initialized');
    } catch (error) {
      console.error('[AirtableSkill] Failed to initialize:', error);
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(
    data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Customer | null> {
    if (!this.base) return null;

    try {
      const record = await this.base(this.config.customersTable).create({
        Name: data.name,
        Phone: data.phone,
        Email: data.email,
        Address: data.address,
        City: data.city,
        State: data.state,
        Zip: data.zip,
        Notes: data.notes
      });

      return this.recordToCustomer(record);
    } catch (error) {
      console.error('[AirtableSkill] Failed to create customer:', error);
      return null;
    }
  }

  /**
   * Find customer by phone
   */
  async findCustomerByPhone(phone: string): Promise<Customer | null> {
    if (!this.base) return null;

    try {
      const records = await this.base(this.config.customersTable)
        .select({
          filterByFormula: `{Phone} = "${escapeFormulaValue(phone)}"`,
          maxRecords: 1
        })
        .firstPage();

      if (records.length > 0) {
        return this.recordToCustomer(records[0]);
      }
      return null;
    } catch (error) {
      console.error('[AirtableSkill] Failed to find customer:', error);
      return null;
    }
  }

  /**
   * Create a new job
   */
  async createJob(data: Booking): Promise<Job | null> {
    if (!this.base) return null;

    try {
      // Find or create customer
      let customer = await this.findCustomerByPhone(data.customerPhone);
      if (!customer) {
        customer = await this.createCustomer({
          name: data.customerName,
          phone: data.customerPhone,
          address: data.address,
          city: '',
          state: '',
          zip: ''
        });
      }

      const record = await this.base(this.config.jobsTable).create({
        Title: data.issue,
        Customer: customer ? [customer.id] : [],
        Address: data.address,
        'Scheduled At': data.scheduledAt.toISOString(),
        Status: 'scheduled',
        Notes: data.notes
      });

      return this.recordToJob(record);
    } catch (error) {
      console.error('[AirtableSkill] Failed to create job:', error);
      return null;
    }
  }

  /**
   * Get jobs for a date range
   */
  async getJobs(startDate: Date, endDate: Date): Promise<Job[]> {
    if (!this.base) return [];

    try {
      const records = await this.base(this.config.jobsTable)
        .select({
          filterByFormula: `AND(
            IS_AFTER({Scheduled At}, "${escapeFormulaValue(startDate.toISOString())}"),
            IS_BEFORE({Scheduled At}, "${escapeFormulaValue(endDate.toISOString())}")
          )`,
          sort: [{ field: 'Scheduled At', direction: 'asc' }]
        })
        .all();

      return records.map((r: any) => this.recordToJob(r));
    } catch (error) {
      console.error('[AirtableSkill] Failed to get jobs:', error);
      return [];
    }
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string,
    status: Job['status']
  ): Promise<boolean> {
    if (!this.base) return false;

    try {
      await this.base(this.config.jobsTable).update(jobId, {
        Status: status
      });
      return true;
    } catch (error) {
      console.error('[AirtableSkill] Failed to update job:', error);
      return false;
    }
  }

  /**
   * Get all customers
   */
  async getCustomers(): Promise<Customer[]> {
    if (!this.base) return [];

    try {
      const records = await this.base(this.config.customersTable)
        .select({
          sort: [{ field: 'Name', direction: 'asc' }]
        })
        .all();

      return records.map((r: any) => this.recordToCustomer(r));
    } catch (error) {
      console.error('[AirtableSkill] Failed to get customers:', error);
      return [];
    }
  }

  /**
   * Get job counts by status
   */
  async getJobStats(): Promise<Record<string, number>> {
    if (!this.base) return {};

    try {
      const records = await this.base(this.config.jobsTable).select().all();

      const stats: Record<string, number> = {
        scheduled: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0
      };

      for (const record of records) {
        const status = record.get('Status') || 'scheduled';
        stats[status] = (stats[status] || 0) + 1;
      }

      return stats;
    } catch (error) {
      console.error('[AirtableSkill] Failed to get stats:', error);
      return {};
    }
  }

  private recordToCustomer(record: any): Customer {
    return {
      id: record.id,
      name: record.get('Name') || '',
      phone: record.get('Phone') || '',
      email: record.get('Email'),
      address: record.get('Address') || '',
      city: record.get('City') || '',
      state: record.get('State') || '',
      zip: record.get('Zip') || '',
      notes: record.get('Notes'),
      createdAt: new Date(record.get('Created') || Date.now()),
      updatedAt: new Date(record.get('Modified') || Date.now())
    };
  }

  private recordToJob(record: any): Job {
    return {
      id: record.id,
      customerId: record.get('Customer')?.[0] || '',
      title: record.get('Title') || '',
      description: record.get('Description') || '',
      status: record.get('Status') || 'scheduled',
      scheduledAt: new Date(record.get('Scheduled At')),
      estimatedDuration: record.get('Duration') || 60,
      technicianId: record.get('Technician')?.[0],
      address: record.get('Address') || '',
      notes: record.get('Notes'),
      createdAt: new Date(record.get('Created') || Date.now()),
      updatedAt: new Date(record.get('Modified') || Date.now())
    };
  }
}
