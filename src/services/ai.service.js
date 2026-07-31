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

const formatCandlesForPrompt = (candles = [], timeframe = "60m") => {
  if (!Array.isArray(candles) || candles.length === 0) {
    return "No historical candle data available.";
  }

  const parsed = candles
    .map((c) => {
      if (!Array.isArray(c) || c.length < 5) return null;
      const [timestamp, open, high, low, close, volume] = c;
      return {
        timestamp,
        date: String(timestamp).slice(0, 10),
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        volume: volume != null ? Number(volume) : null,
      };
    })
    .filter(Boolean);

  if (!parsed.length) {
    return "No historical candle data available.";
  }

  const closes = parsed.map((c) => c.close).filter(Number.isFinite);
  const highs = parsed.map((c) => c.high).filter(Number.isFinite);
  const lows = parsed.map((c) => c.low).filter(Number.isFinite);
  const volumes = parsed.map((c) => c.volume).filter(Number.isFinite);

  const periodHigh = highs.length ? Math.max(...highs) : "N/A";
  const periodLow = lows.length ? Math.min(...lows) : "N/A";
  const firstClose = closes.length ? closes[0] : "N/A";
  const lastClose = closes.length ? closes[closes.length - 1] : "N/A";
  const periodChangePct =
    closes.length > 1 && closes[0]
      ? (((closes[closes.length - 1] - closes[0]) / closes[0]) * 100).toFixed(2)
      : "N/A";
  const avgVolume = volumes.length
    ? Math.round(volumes.reduce((sum, v) => sum + v, 0) / volumes.length)
    : "N/A";

  const dailyMap = new Map();
  parsed.forEach((c) => {
    dailyMap.set(c.date, c);
  });
  const dailyRows = Array.from(dailyMap.values())
    .slice(-15)
    .map((c) => `${c.date}: close ${c.close}, volume ${c.volume ?? "N/A"}`);

  const recentRows = parsed
    .slice(-12)
    .map((c) => `${c.timestamp}: O ${c.open} H ${c.high} L ${c.low} C ${c.close} V ${c.volume ?? "N/A"}`);

  return `
Timeframe: ${timeframe}
Total candles: ${parsed.length}
Period high: ${periodHigh}
Period low: ${periodLow}
First close: ${firstClose}
Last close: ${lastClose}
Period change %: ${periodChangePct}
Average volume: ${avgVolume}

Daily summary (most recent ${dailyRows.length} trading days):
${dailyRows.join("\n")}

Most recent ${recentRows.length} candles:
${recentRows.join("\n")}
`.trim();
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SHORT_TERM_OPTIONS = ["STRONG BUY", "BUY", "HOLD", "AVOID", "SELL"];
const LONG_TERM_OPTIONS = ["STRONG BUY", "BUY", "HOLD", "SELL"];
const CONFIDENCE_OPTIONS = ["VERY LOW", "LOW", "MEDIUM", "HIGH", "VERY HIGH"];

const normalizeChoice = (value, allowed) => {
  if (value == null) return allowed.includes("HOLD") ? "HOLD" : allowed[0];

  const raw = String(value).trim().toUpperCase();
  if (!raw) return allowed.includes("HOLD") ? "HOLD" : allowed[0];

  // Exact match
  if (allowed.includes(raw)) return raw;

  // Model sometimes returns "SELL | AVOID | BUY" — pick the first valid option
  const parts = raw
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (allowed.includes(part)) return part;
  }

  // Fuzzy: find first allowed option that appears as a whole token in the string
  for (const option of allowed) {
    const re = new RegExp(`(?:^|[^A-Z])${option.replace(/\s+/g, "\\s+")}(?:[^A-Z]|$)`);
    if (re.test(raw)) return option;
  }

  return allowed.includes("HOLD") ? "HOLD" : allowed[0];
};

const sanitizeAIAnalysis = (parsed) => {
  if (!parsed || typeof parsed !== "object" || parsed.error) return parsed;

  return {
    ...parsed,
    short_term: normalizeChoice(parsed.short_term, SHORT_TERM_OPTIONS),
    long_term: normalizeChoice(parsed.long_term, LONG_TERM_OPTIONS),
    confidence: normalizeChoice(parsed.confidence, CONFIDENCE_OPTIONS),
    reason: typeof parsed.reason === "string" ? parsed.reason.trim() : parsed.reason,
  };
};

const callGroq = async (content, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content }],
          temperature: 0.3,
          max_tokens: 300,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data?.choices?.[0]?.message?.content || "";
    } catch (error) {
      const groqError = error?.response?.data?.error;
      const isRateLimited = groqError?.code === "rate_limit_exceeded";
      const canRetry = attempt < retries && isRateLimited;

      if (!canRetry) throw error;

      const retryMatch = groqError?.message?.match(/try again in ([\d.]+)s/i);
      const waitMs = retryMatch ? Math.ceil(Number(retryMatch[1]) * 1000) + 500 : 3000;
      await sleep(waitMs);
    }
  }

  return "";
};

export const getAIAnalysisService = async (payload) => {
  try {
    const { name = "N/A", exchange = "N/A", snapshot = {}, candles = [], timeframe = "60m" } = payload;

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

Historical Candle Data (recent price movement):
${formatCandlesForPrompt(candles, timeframe)}

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
  "short_term": "HOLD",
  "long_term": "HOLD",
  "confidence": "MEDIUM",
  "reason": "Detailed beginner-friendly explanation"
}

Field rules (CRITICAL):
- short_term MUST be exactly ONE of these values: "STRONG BUY", "BUY", "HOLD", "AVOID", "SELL"
- long_term MUST be exactly ONE of these values: "STRONG BUY", "BUY", "HOLD", "SELL"
- confidence MUST be exactly ONE of these values: "VERY LOW", "LOW", "MEDIUM", "HIGH", "VERY HIGH"
- Never return multiple options joined by "|", commas, or any other separator.
- Never list alternatives. Pick a single final decision for each field.

Analysis rules:
- Short term = intraday / few days
- Long term = months / investment view
- Use the historical candle data to understand recent price movement, highs/lows, and trading activity
- If recent candles show sharp rises or falls, mention that in your reasoning
- If stock is near 52-week high, avoid aggressive short-term BUY

- The reason MUST be 3-5 complete sentences.
- Explain the recommendation using the snapshot and historical candle data provided above.
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

    const response = await callGroq(content);

    const raw = response;

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      parsed = sanitizeAIAnalysis(parsed);
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
    const groqError = error?.response?.data?.error;
    console.error("AI SERVICE ERROR:", groqError || error.message);

    if (groqError?.code === "rate_limit_exceeded") {
      return {
        statusCode: 429,
        status: "FAILED",
        message: "AI service is busy. Please try again in a moment.",
      };
    }

    return {
      statusCode: 500,
      status: "FAILED",
      message: "AI analysis failed",
    };
  }
};
