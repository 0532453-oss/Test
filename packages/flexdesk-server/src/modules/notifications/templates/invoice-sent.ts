export interface InvoiceSentData {
  customerName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  paymentLink?: string;
  workspaceName: string;
}

export function invoiceSentTemplate(data: InvoiceSentData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `You have a new invoice from ${data.workspaceName}`;

  const paymentSection = data.paymentLink
    ? `<tr><td style="padding: 16px 0;">
        <a href="${data.paymentLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">Pay Now</a>
      </td></tr>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
        <tr><td style="background-color: #2563eb; padding: 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 20px;">New Invoice</h1>
        </td></tr>
        <tr><td style="padding: 32px 24px;">
          <p style="margin: 0 0 16px; color: #374151; font-size: 16px;">Hi ${data.customerName},</p>
          <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">You have a new invoice from <strong>${data.workspaceName}</strong>.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <tr><td style="padding: 8px 16px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Invoice Number</p>
              <p style="margin: 4px 0 0; color: #111827; font-size: 16px; font-weight: 600;">${data.invoiceNumber}</p>
            </td></tr>
            <tr><td style="padding: 8px 16px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Amount Due</p>
              <p style="margin: 4px 0 0; color: #111827; font-size: 24px; font-weight: 700;">$${data.amount}</p>
            </td></tr>
            <tr><td style="padding: 8px 16px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Due Date</p>
              <p style="margin: 4px 0 0; color: #111827; font-size: 16px; font-weight: 600;">${data.dueDate}</p>
            </td></tr>
          </table>
          ${paymentSection}
        </td></tr>
        <tr><td style="padding: 24px; background-color: #f9fafb; text-align: center;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">${data.workspaceName}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${data.customerName},

You have a new invoice from ${data.workspaceName}.

Invoice Number: ${data.invoiceNumber}
Amount Due: $${data.amount}
Due Date: ${data.dueDate}
${data.paymentLink ? `\nPay now: ${data.paymentLink}` : ''}

- ${data.workspaceName}`;

  return { subject, html, text };
}
