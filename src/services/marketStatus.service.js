import fetch from "node-fetch";

export const fetchMarketStatus = async () => {
  const url = "https://www.nseindia.com/api/marketStatus";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
      Referer: "https://www.nseindia.com/",
    },
  });

  const data = await response.json();

  const marketState = data?.marketState || [];

  // 🎯 Extract only required markets
  const capitalMarket = marketState.find(
    (m) => m.market === "Capital Market"
  );

  const commodityMarket = marketState.find(
    (m) => m.market === "Commodity"
  );

  return {
    "Capital Market": capitalMarket || {},
    "Commodity": commodityMarket || {},
  };
};

export const isMarketOpen = async (exch) => {

  const result = await fetchMarketStatus();

  // NSE / BSE
  if (exch === "N" || exch === "B") {

    return (
      result["Capital Market"]?.marketStatus === "Open"
    );
  }

  // MCX
  if (exch === "M") {

    return (
      result["Commodity"]?.marketStatus === "Open"
    );
  }

  return false;
};