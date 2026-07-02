import { Resend } from "resend";

// Lazy initialization to avoid build-time error on Vercel
let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

interface DiscrepancyAlert {
  itemName: string;
  qtyDiff: number;
  priceDiff: number;
  valueDiff: number;
}

interface POData {
  poNumber: string;
  supplierName: string;
  dateOrdered: Date;
}

export async function sendDiscrepancyAlert(
  po: POData,
  discrepancies: DiscrepancyAlert[],
  totalValueDiff: number
) {
  const { data, error } = await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || "noreply@resend.dev",
    to: ["keuangan@pytagotech.com"], // TODO: configurable per environment
    subject: `[ALERT] Discrepancy Detected - PO ${po.poNumber}`,
    html: `
      <h2>Discrepancy Alert</h2>
      <p><strong>PO Number:</strong> ${po.poNumber}</p>
      <p><strong>Supplier:</strong> ${po.supplierName}</p>
      <p><strong>Date Ordered:</strong> ${new Date(po.dateOrdered).toLocaleDateString("id-ID")}</p>

      <h3>Discrepancies Found:</h3>
      <table style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 8px; border: 1px solid #dee2e6; text-align: left;">Item</th>
            <th style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">Qty Diff</th>
            <th style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">Price Diff</th>
            <th style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">Value Diff</th>
          </tr>
        </thead>
        <tbody>
          ${discrepancies.map(d => `
            <tr>
              <td style="padding: 8px; border: 1px solid #dee2e6;">${d.itemName}</td>
              <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">${d.qtyDiff > 0 ? '+' : ''}${d.qtyDiff}</td>
              <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">${d.priceDiff > 0 ? '+' : ''}Rp ${d.priceDiff.toLocaleString("id-ID")}</td>
              <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">${d.valueDiff > 0 ? '+' : ''}Rp ${d.valueDiff.toLocaleString("id-ID")}</td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr style="font-weight: bold; background-color: #fff3cd;">
            <td colspan="3" style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">Total Value Diff:</td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: right;">${totalValueDiff > 0 ? '+' : ''}Rp ${totalValueDiff.toLocaleString("id-ID")}</td>
          </tr>
        </tfoot>
      </table>

      <p style="margin-top: 20px;">
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/purchase-orders/${po.poNumber}"
           style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View PO Details
        </a>
      </p>

      <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
        This is an automated alert from PO Reconciliation Dashboard.
      </p>
    `,
  });

  if (error) {
    console.error("[email] Failed to send discrepancy alert:", error);
    throw error;
  }

  console.log("[email] Discrepancy alert sent:", data?.id);
  return data;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const { data, error } = await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || "noreply@resend.dev",
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[email] Failed to send email:", error);
    throw error;
  }

  return data;
}
