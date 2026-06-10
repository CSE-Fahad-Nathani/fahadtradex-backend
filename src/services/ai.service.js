import axios from "axios";

const SNAPSHOT_LABELS = {
  AHigh: "52 Week High",
  ALow: "52 Week Low",
  AverageTradePrice: "Average Trade Price",
  BuyQuantity: "Buy Quantity",
  Exchange: "Exchange Code",
  ExchangeType: "Exchange Type",
  ExposureCategory: "Exposure Category",
  High: "Day High",
  LastQuantity: "Last Trade Quantity",
  LastTradeTime: "Last Trade Time",
  LastTradedPrice: "Last Traded Price (LTP)",
  Low: "Day Low",
  LowerCircuitLimit: "Lower Circuit Limit",
  MarketCapital: "Market Capital",
  NetChange: "Net Change",
  Open: "Open",
  OpenInterest: "Open Interest",
  PClose: "Previous Close",
  ScripCode: "Scrip Code",
  SellQuantity: "Sell Quantity",
  TotalBuyQuantity: "Total Buy Quantity",
  TotalSellQuantity: "Total Sell Quantity",
  UpperCircuitLimit: "Upper Circuit Limit",
  Volume: "Volume",
};

const formatSnapshotForPrompt = (snapshot = {}) => {
  return Object.entries(snapshot)
    .map(([key, value]) => `- ${SNAPSHOT_LABELS[key] || key}: ${value ?? "N/A"}`)
    .join("\n");
};

export const getAIAnalysisService = async (payload) => {
  try {
    const { name = "N/A", exchange = "N/A", snapshot = {} } = payload;

    const pClose = Number(snapshot.PClose);
    const netChange = Number(snapshot.NetChange);
    const dayChangePerc = pClose ? ((netChange / pClose) * 100).toFixed(2) : "N/A";
    const isMCX = snapshot.Exchange === "M" || exchange === "MCX";

    const content = `
You are a professional stock trading assistant.

Analyze the stock using the given data.

Stock Data:
- Name: ${name}
- Exchange: ${exchange}
- Day Change %: ${dayChangePerc}%

Market Snapshot:
${formatSnapshotForPrompt(snapshot)}

${isMCX ? `
Important:
- This is an MCX commodity contract.
- The contract has an expiry date in its symbol/name.
- After expiry, the contract will stop trading.
- For long-term recommendations, consider that the contract cannot be held beyond its expiry.
- Avoid giving STRONG BUY or BUY for long-term if the contract is close to expiry.
- Long-term recommendations for expiring contracts should be conservative.
` : ""}

Return STRICT JSON ONLY in this format:

{
  "short_term": "STRONG BUY | BUY | HOLD | AVOID | SELL",
  "long_term": "STRONG BUY | BUY | HOLD | SELL",
  "confidence": "VERY LOW | LOW | MEDIUM | HIGH | VERY HIGH",
  "reason": "Detailed beginner-friendly explanation"
}

Rules:
- Short term = intraday / few days
- Long term = months / investment view
- If stock is near 52-week high, avoid aggressive short-term BUY

- The reason MUST be 3-5 complete sentences.
- Explain the recommendation using only the data provided above.
- Do not guess future price movements.
- Do not claim the stock will go up or down.
- Do not make predictions about future returns.
- Explain what in the provided data influenced the recommendation.
- If the available data is limited, clearly mention that.
- Explain why the short_term recommendation was selected.
- Explain why the long_term recommendation was selected.
- Explain why the confidence level was selected.
- Write as if explaining to someone completely new to stock investing.
- Use simple everyday English.
- Avoid technical stock market terms and jargon.
- Do not use words like RSI, MACD, support, resistance, breakout, momentum, volatility, trendline, fundamentals, indicators, bullish, bearish, liquidity, or chart patterns.
- Do not start directly with "Short-term:" or "Long-term:".
- Do not use bullet points.
- Keep the explanation between 50 and 100 words.

- The explanation should sound helpful and natural, not like a checklist.
- Focus on explaining the recommendation rather than describing the stock.

- No markdown.
- No extra text.
- Only JSON.
`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/responses",
      {
        model: "openai/gpt-oss-20b",
        input: content,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const raw =
      response.data?.output
        ?.find((item) => item.type === "message")
        ?.content?.find((c) => c.type === "output_text")
        ?.text || "";

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      parsed = {
        error: "Invalid JSON from AI",
        raw,
      };
    }

    return {
      statusCode: 200,
      status: "SUCCESS",
      data: parsed,
    };
  } catch (error) {
    console.error("AI SERVICE ERROR:", error?.response?.data || error.message);

    return {
      statusCode: 500,
      status: "FAILED",
      message: "AI analysis failed",
    };
  }
};
