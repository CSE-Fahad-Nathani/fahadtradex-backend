import axios from "axios";

const RESEND_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "fahadtradex@resend.dev";

/**
 * Global Resend email sender — call from anywhere.
 *
 * @param {{ to: string, subject: string, html: string, from?: string }} options
 * @returns {Promise<{ success: boolean, skipped?: boolean, error?: string }>}
 *
 * @example
 * await sendEmail({
 *   to: "user@gmail.com",
 *   subject: "Hello",
 *   html: "<p>Body here</p>",
 * });
 */
export const sendEmail = async ({ to, subject, html, from = FROM_EMAIL }) => {
  try {
    if (!to) {
      console.warn("EMAIL skipped: missing recipient");
      return { success: false, skipped: true };
    }
    if (!subject || !html) {
      console.warn("EMAIL skipped: missing subject or html");
      return { success: false, skipped: true };
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("EMAIL skipped: RESEND_API_KEY not configured");
      return { success: false, skipped: true };
    }

    await axios.post(
      RESEND_URL,
      { from, to, subject, html },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    console.log(`EMAIL OK → ${to} (${subject})`);
    return { success: true };
  } catch (error) {
    console.error(
      "EMAIL ERROR:",
      error?.response?.data || error.message || error
    );
    return { success: false, error: error?.message };
  }
};

const exchangeLabel = (exch) => {
  if (exch === "N") return "NSE";
  if (exch === "B") return "BSE";
  if (exch === "M") return "MCX";
  return exch || "—";
};

const formatINR = (value) => {
  const num = Number(value || 0);
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const buildTradeEmailHtml = ({
  type,
  name,
  symbol,
  exch,
  price,
  quantity,
  lots,
  totalValue,
  pnl,
}) => {
  const isBuy = type === "BUY";
  const accent = isBuy ? "#00c98a" : "#ff4d6a";
  const accentSoft = isBuy ? "rgba(0,201,138,0.12)" : "rgba(255,77,106,0.12)";
  const title = isBuy ? "Buy Order Confirmed" : "Sell Order Confirmed";
  const subtitle = isBuy
    ? "Your purchase has been executed successfully."
    : "Your sale has been executed successfully.";
  const qtyLabel = lots != null ? "Lots" : "Quantity";
  const qtyValue = lots != null ? lots : quantity;
  const actionVerb = isBuy ? "Debited" : "Credited";
  const when = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const pnlRow =
    !isBuy && pnl != null
      ? `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #1f2937;color:#94a3b8;font-size:13px;">Est. P&amp;L</td>
        <td style="padding:12px 0;border-bottom:1px solid #1f2937;color:${Number(pnl) >= 0 ? "#00c98a" : "#ff4d6a"};font-size:13px;font-weight:700;text-align:right;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">
          ${Number(pnl) >= 0 ? "+" : ""}₹${formatINR(pnl)}
        </td>
      </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#070b14;font-family:Inter,Segoe UI,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#070b14;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#0d111c;border:1px solid #1f2937;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="height:4px;background:${accent};"></td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px 28px;">
              <p style="margin:0;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#64748b;font-weight:700;">FahadTradeX</p>
              <h1 style="margin:10px 0 0 0;font-size:24px;line-height:1.25;color:#f8fafc;">${title}</h1>
              <p style="margin:8px 0 0 0;font-size:14px;color:#94a3b8;line-height:1.5;">${subtitle}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;">
              <div style="background:${accentSoft};border:1px solid ${accent}33;border-radius:12px;padding:18px 20px;">
                <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${accent};font-weight:700;">${isBuy ? "BUY" : "SELL"} · ${exchangeLabel(exch)}</p>
                <p style="margin:8px 0 0 0;font-size:18px;font-weight:700;color:#f8fafc;">${name || symbol}</p>
                <p style="margin:4px 0 0 0;font-size:13px;color:#94a3b8;">${symbol}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:4px 28px 8px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #1f2937;color:#94a3b8;font-size:13px;">Price</td>
                  <td style="padding:12px 0;border-bottom:1px solid #1f2937;color:#f8fafc;font-size:13px;font-weight:600;text-align:right;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">₹${formatINR(price)}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #1f2937;color:#94a3b8;font-size:13px;">${qtyLabel}</td>
                  <td style="padding:12px 0;border-bottom:1px solid #1f2937;color:#f8fafc;font-size:13px;font-weight:600;text-align:right;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${qtyValue}</td>
                </tr>
                ${pnlRow}
                <tr>
                  <td style="padding:14px 0 6px 0;color:#f8fafc;font-size:14px;font-weight:700;">${actionVerb}</td>
                  <td style="padding:14px 0 6px 0;color:${accent};font-size:18px;font-weight:800;text-align:right;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">₹${formatINR(totalValue)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px 28px;">
              <p style="margin:0;font-size:12px;color:#64748b;">Executed on ${when} IST</p>
              <p style="margin:14px 0 0 0;font-size:12px;color:#64748b;line-height:1.6;">
                This is an automated confirmation from FahadTradeX paper trading.
                If you did not place this order, please secure your account immediately.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#0a0e17;border-top:1px solid #1f2937;padding:16px 28px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#475569;">© ${new Date().getFullYear()} FahadTradeX · Practice trading with live market data</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Trade confirmation wrapper — builds HTML then calls sendEmail.
 * Never throws — failures are logged only.
 */
export const sendTradeConfirmationEmail = async ({
  to,
  type,
  name,
  symbol,
  exch,
  price,
  quantity,
  lots,
  totalValue,
  pnl,
}) => {
  const isBuy = type === "BUY";
  const subject = isBuy
    ? `Buy Confirmed · ${symbol} · ₹${formatINR(totalValue)}`
    : `Sell Confirmed · ${symbol} · ₹${formatINR(totalValue)}`;

  const html = buildTradeEmailHtml({
    type,
    name,
    symbol,
    exch,
    price,
    quantity,
    lots,
    totalValue,
    pnl,
  });

  return sendEmail({ to, subject, html });
};
