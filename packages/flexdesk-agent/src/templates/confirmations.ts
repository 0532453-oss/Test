/**
 * Confirmation Templates
 *
 * Message templates for customer communications.
 */

export const confirmationTemplates = {
  /**
   * Appointment confirmation
   */
  appointmentConfirmed: (data: {
    businessName: string;
    date: string;
    time: string;
    address: string;
    technicianName?: string;
  }) => {
    let message = `You're all set! Your appointment with ${data.businessName} is confirmed for ${data.date} at ${data.time}.`;

    if (data.technicianName) {
      message += ` ${data.technicianName} will be your technician.`;
    }

    message += ` We'll call 15 minutes before arrival. Reply to this number if you need to reschedule.`;

    return message;
  },

  /**
   * Appointment reminder (day before)
   */
  appointmentReminder: (data: {
    businessName: string;
    date: string;
    time: string;
  }) => {
    return `Reminder: Your appointment with ${data.businessName} is tomorrow at ${data.time}. Reply YES to confirm or RESCHEDULE if you need to change.`;
  },

  /**
   * Technician on the way
   */
  technicianEnRoute: (data: {
    technicianName: string;
    eta: string;
  }) => {
    return `${data.technicianName} is on the way and should arrive in about ${data.eta}. They'll call when they're close.`;
  },

  /**
   * Job completed follow-up
   */
  jobCompleted: (data: {
    businessName: string;
    reviewLink?: string;
  }) => {
    let message = `Thank you for choosing ${data.businessName}! We hope everything is working great.`;

    if (data.reviewLink) {
      message += ` If you have a moment, we'd appreciate a review: ${data.reviewLink}`;
    }

    message += ` Reply to this number if you have any questions.`;

    return message;
  },

  /**
   * Quote follow-up
   */
  quoteFollowUp: (data: {
    businessName: string;
    quoteAmount?: number;
    daysAgo: number;
  }) => {
    let message = `Hi! Just following up on your recent inquiry with ${data.businessName}.`;

    if (data.quoteAmount) {
      message += ` We quoted $${data.quoteAmount.toLocaleString()} for the work.`;
    }

    message += ` Would you like to move forward or do you have any questions?`;

    return message;
  },

  /**
   * Invoice reminder
   */
  invoiceReminder: (data: {
    businessName: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    paymentLink?: string;
  }) => {
    let message = `Hi, this is a friendly reminder from ${data.businessName}. Invoice #${data.invoiceNumber} for $${data.amount.toLocaleString()} was due on ${data.dueDate}.`;

    if (data.paymentLink) {
      message += ` Pay online: ${data.paymentLink}`;
    } else {
      message += ` Please give us a call to arrange payment.`;
    }

    return message;
  },

  /**
   * Seasonal maintenance reminder
   */
  maintenanceReminder: (data: {
    businessName: string;
    season: 'summer' | 'winter';
    lastServiceDate?: string;
  }) => {
    const seasonText = data.season === 'summer' ? 'summer heat' : 'winter cold';

    let message = `Hi from ${data.businessName}! With the ${seasonText} coming up, it's a great time for a tune-up to make sure your system is ready.`;

    if (data.lastServiceDate) {
      message += ` Your last service was on ${data.lastServiceDate}.`;
    }

    message += ` Reply YES to schedule a maintenance visit.`;

    return message;
  },

  /**
   * Emergency response
   */
  emergencyAcknowledged: (data: {
    businessName: string;
    eta: string;
    emergencyFee: number;
  }) => {
    return `We understand this is urgent. A technician from ${data.businessName} will be there within ${data.eta}. Emergency after-hours rate is $${data.emergencyFee} call-out fee plus repairs. They'll call when they're on the way.`;
  },

  /**
   * Reschedule confirmation
   */
  rescheduleConfirmed: (data: {
    oldDate: string;
    oldTime: string;
    newDate: string;
    newTime: string;
  }) => {
    return `Your appointment has been rescheduled from ${data.oldDate} at ${data.oldTime} to ${data.newDate} at ${data.newTime}. We'll send a reminder the day before.`;
  },

  /**
   * Cancellation confirmation
   */
  cancellationConfirmed: (data: {
    businessName: string;
  }) => {
    return `Your appointment has been cancelled. If you'd like to reschedule in the future, just text us here. Thank you for considering ${data.businessName}.`;
  }
};

export type ConfirmationTemplateKey = keyof typeof confirmationTemplates;
