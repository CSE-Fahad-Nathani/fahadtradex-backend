export const fetchMarketStatus = async () => {

  const now = new Date();

  const ist = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    })
  );

  const day = ist.getDay(); // 0=Sunday, 6=Saturday

  const currentMinutes =
    ist.getHours() * 60 + ist.getMinutes();

  // Weekend
  const isWeekend = day === 0 || day === 6;

  // NSE / BSE
  const capitalMarketOpen =
    !isWeekend &&
    currentMinutes >= (9 * 60 + 15) &&
    currentMinutes <= (15 * 60 + 30);

  // MCX
  const commodityMarketOpen =
    !isWeekend &&
    currentMinutes >= (9 * 60) &&
    currentMinutes <= (23 * 60 + 30);

  return {
    "Capital Market": {
      marketStatus: capitalMarketOpen ? "Open" : "Closed",
    },
    "Commodity": {
      marketStatus: commodityMarketOpen ? "Open" : "Closed",
    },
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