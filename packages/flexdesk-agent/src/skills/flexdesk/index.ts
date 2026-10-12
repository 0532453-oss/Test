/**
 * FlexDesk Skill
 *
 * Native integration with FlexDesk CRM for bundle mode.
 * Provides full access to customers, jobs, estimates, and invoices.
 */

import axios, { AxiosInstance } from 'axios';
import { FlexDeskConfig, Customer, Job, Booking } from '../../types';

export class FlexDeskSkill {
  private config: FlexDeskConfig;
  private client: AxiosInstance;

  constructor(config: FlexDeskConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true,
    });

    console.log('[FlexDeskSkill] Client initialized');
  }

  // ============ CUSTOMERS ============

  /**
   * Create a new customer
   */
  async createCustomer(
    data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Customer | null> {
    try {
      const response = await this.client.post('/customers', data);
      return response.data;
    } catch (error) {
      console.error('[FlexDeskSkill] Failed to create customer:', error);
      return null;
    }
  }

  /**
   * Find customer by phone
   */
  async findCustomerByPhone(phone: string): Promise<Customer | null> {
    try {
      const response = await this.client.get('/customers', {
        params: { phone }
      });
      return response.data.data?.[0] || null;
    } catch (error) {
      console.error('[FlexDeskSkill] Failed to find customer:', error);
      return null;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(id: string): Promise<Customer | null> {
    try {
      const response = await this.client.get(`/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error('[FlexDeskSkill] Failed to get customer:', error);
      return null;
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(
    id: string,
    data: Partial<Customer>
  ): Promise<Customer | null> {
    try {
      const response = await this.client.patch(`/customers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('[FlexDeskSkill] Failed to update customer:', error);
      return null;
    }
  }

  /**
   * List all customers
   */
  async listCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: Customer[]; total: number }> {
    try {
      const response = await this.client.get('/customers', { params });
      return response.data;
    } catch (error) {
      console.error('[FlexDeskSkill] Failed to list customers:', error);
      return { data: [], total: 0 };
    }
  }

  // ============ JOBS ============

  /**
   * Create a new job from booking data
   */
  async createJob(data: Booking): Promise<Job | null> {
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
          zip: '',
          email: ''
        });
      }

      const response = await this.client.post('/jobs', {
        customerId: customer?.id,
        title: data.issue,
        description: data.notes,
        address: data.address,
        scheduledAt: data.scheduledAt.toISOString(),
        status: 'scheduled'
      });

      return response.data;
    } catch (error) {
      console.error('[FlexDeskSkill] Failed to create job:', error);
      return null;
    }
  }

  /**
   * Get job by ID
   */
  async getJob(id: string): Promise<Job | null> {
    try {
      const response = await this.client.get(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      console.error('[FlexDeskSkill] Failed to get job:', error);
      return null;
    }
  }

  /**
   * Update job
   */
  async updateJob(id: string, data: Partial<Job>): Promise<Job | null> {
    try {
      const response = await this.client.patch(`/jobs/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('[FlexDeskSkill] Failed to update job:', error);
      return null;
    }
  }

  /**
   * Get jobs for a date range
   */
  async getJobs(startDate: Date, endDate: Date): Promise<Job[]> {
    try {
      const response = await this.client.get('/jobs', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('[FlexDeskSkill] Failed to get jobs:', error);
      return [];
    }
  }

  /**
   * Get today's schedule
   */
  async getTodaySchedule(): Promise<Job[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getJobs(today, tomorrow);
  }

  /**
   * Complete a job
   */
  async completeJob(id: string, notes?: string): Promise<boolean> {
    try {
      await this.client.post(`/jobs/${id}/complete`, { notes });
      return true;
    } catch (error) {
      console.error('[FlexDeskSkill] Failed to complete job:', error);
      return false;
    }
  }

  // ============ ESTIMATES ============

  /**
   * Create an estimate
   */
  async createEstimate(data: {
    customerId: string;
    title: string;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
    validUntil?: Date;
  }): Promise<any> {
    try {
      const response = await this.client.post('/estimates', data);
      return response.data;
    } catch (error) {
      console.error('[FlexDeskSkill] Failed to create estimate:', error);
      return null;
    }
  }

  /**
   * Send an estimate
   */
  async sendEstimate(id: string): Promise<boolean> {
    try {
      await this.client.post(`/estimates/${id}/send`);
      return true;
    } catch (error) {
      console.error('[FlexDeskSkill] Failed to send estimate:', error);
      return false;
    }
  }

  // ============ INVOICES ============

  /**
   * Create an invoice from a job
   */
  async createInvoiceFromJob(jobId: string): Promise<any> {
    try {
      const response = await this.client.post('/invoices', { jobId });
      return response.data;
    } catch (error) {
      console.error('[FlexDeskSkill] Failed to create invoice:', error);
      return null;
    }
  }

  /**
   * Send an invoice
   */
  async sendInvoice(id: string): Promise<boolean> {
    try {
      await this.client.post(`/invoices/${id}/send`);
      return true;
    } catch (error) {
      console.error('[FlexDeskSkill] Failed to send invoice:', error);
      return false;
    }
  }

  /**
   * Mark invoice as paid
   */
  async markInvoicePaid(id: string): Promise<boolean> {
    try {
      await this.client.post(`/invoices/${id}/mark-paid`);
      return true;
    } catch (error) {
      console.error('[FlexDeskSkill] Failed to mark invoice paid:', error);
      return false;
    }
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(): Promise<any[]> {
    try {
      const response = await this.client.get('/invoices', {
        params: { status: 'overdue' }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('[FlexDeskSkill] Failed to get overdue invoices:', error);
      return [];
    }
  }

  // ============ DASHBOARD / STATS ============

  /**
   * Get dashboard stats
   */
  async getDashboardStats(): Promise<{
    todayJobs: number;
    weekJobs: number;
    pendingEstimates: number;
    overdueInvoices: number;
    revenue: { week: number; month: number };
  }> {
    try {
      const response = await this.client.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('[FlexDeskSkill] Failed to get stats:', error);
      return {
        todayJobs: 0,
        weekJobs: 0,
        pendingEstimates: 0,
        overdueInvoices: 0,
        revenue: { week: 0, month: 0 }
      };
    }
  }
}
