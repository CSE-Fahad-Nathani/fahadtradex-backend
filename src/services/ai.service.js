import axios from "axios";

export const getAIAnalysisService = async (payload) => {
  try {
    // 🔥 Build dynamic content
    const {
      name = "N/A",
      exchange = "N/A",
      last_price,
      ohlc = {},
      day_change,
      day_change_perc,
      week_52_high,
      week_52_low
    } = payload;

    const content = `
You are a professional stock trading assistant.

Analyze the stock using the given data.

Stock Data:
- Name: ${name}
- Exchange: ${exchange}
- Last Price (LTP): ${last_price ?? "N/A"}
- Open: ${ohlc.open ?? "N/A"}
- High: ${ohlc.high ?? "N/A"}
- Low: ${ohlc.low ?? "N/A"}
- Previous Close: ${ohlc.close ?? "N/A"}
- Day Change: ${day_change ?? "N/A"} (${day_change_perc ?? "N/A"}%)
- 52 Week High: ${week_52_high ?? "N/A"}
- 52 Week Low: ${week_52_low ?? "N/A"}

Return STRICT JSON ONLY in this format:

{
  "short_term": "STRONG BUY | BUY | HOLD | AVOID | SELL",
  "long_term": "STRONG BUY | BUY | HOLD | SELL",
  "confidence": "VERY LOW | LOW | MEDIUM | HIGH | VERY HIGH",
  "reason": "short explanation"
}

Rules:
- Short term = intraday / few days
- Long term = months / investment view
- If stock is near 52-week high, avoid aggressive short-term BUY
- Consider momentum, risk, and position in range
- No markdown
- No extra text
- Only JSON
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openrouter/free",
        messages: [
          {
            role: "user",
            content
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const raw = response.data.choices[0].message.content;

    // 🔥 Safe JSON parse
    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      parsed = {
        error: "Invalid JSON from AI",
        raw
      };
    }

    return {
      statusCode: 200,
      status: "SUCCESS",
      data: parsed
    };

  } catch (error) {
    console.error("AI SERVICE ERROR:", error?.response?.data || error.message);

    return {
      statusCode: 500,
      status: "FAILED",
      message: "AI analysis failed"
    };
  }
};