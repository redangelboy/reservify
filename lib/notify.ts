import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function notifyCancelRequest({
  ownerEmail,
  ownerName,
  businessName,
  clientName,
  serviceName,
  staffName,
  date,
  reason,
}: {
  ownerEmail: string;
  ownerName: string;
  businessName: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  date: Date;
  reason: string;
}) {
  const dateStr = new Date(date).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Chicago",
  });

  const result = await resend.emails.send({
    from: "Callendra <callendra@voxproai.com>",
    to: ownerEmail,
    subject: `⚠️ Cancel request — ${clientName} at ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 12px;">
        <h2 style="color: #facc15; margin-bottom: 4px;">⚠️ Cancel Request</h2>
        <p style="color: #9ca3af; margin-bottom: 24px;">${businessName}</p>

        <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <p style="margin: 0 0 8px 0;"><strong>Client:</strong> ${clientName}</p>
          <p style="margin: 0 0 8px 0;"><strong>Service:</strong> ${serviceName}</p>
          <p style="margin: 0 0 8px 0;"><strong>Barber:</strong> ${staffName}</p>
          <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${dateStr}</p>
        </div>

        <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 3px solid #facc15;">
          <p style="margin: 0 0 4px 0; color: #facc15; font-size: 12px;">REASON</p>
          <p style="margin: 0; color: #ffffff;">${reason}</p>
        </div>

        <a href="https://app.callendra.com/en/dashboard" 
           style="display: inline-block; background: #ffffff; color: #000000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Review in Dashboard →
        </a>

        <p style="color: #4b5563; font-size: 12px; margin-top: 24px;">Callendra · appointment management</p>
      </div>
    `,
  });
}
