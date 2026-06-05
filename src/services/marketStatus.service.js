export const isMarketOpen = async (exch) => {

  // Current IST time
  const now = new Date();

  const ist = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    })
  );

  const day = ist.getDay(); // 0 = Sunday, 6 = Saturday

  // Weekend check
  if (day === 0 || day === 6) {
    return false;
  }

  const currentMinutes =
    ist.getHours() * 60 + ist.getMinutes();

  // NSE / BSE
  if (exch === "N" || exch === "B") {

    const marketOpen = 9 * 60 + 15; // 09:15 AM
    const marketClose = 15 * 60 + 30; // 03:30 PM

    return (
      currentMinutes >= marketOpen &&
      currentMinutes <= marketClose
    );
  }

  // MCX
  if (exch === "M") {

    const marketOpen = 9 * 60; // 09:00 AM
    const marketClose = 23 * 60 + 30; // 11:30 PM

    return (
      currentMinutes >= marketOpen &&
      currentMinutes <= marketClose
    );
  }

  return false;
};