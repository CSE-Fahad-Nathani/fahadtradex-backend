import axios from "axios";

export const getHistoricalService = async ({
  accessToken,
  Exch,
  ExchType,
  ScripCode,
  TimeFrame,
  FromDate,
  ToDate
}) => {
  try {
    const url = `https://openapi.5paisa.com/V2/historical/${Exch}/${ExchType}/${ScripCode}/${TimeFrame}?from=${FromDate}&end=${ToDate}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    return {
      statusCode: 200,
      status: "SUCCESS",
      data: response.data
    };

  } catch (error) {
    console.error("HISTORICAL ERROR:", error?.response?.data || error.message);

    return {
      statusCode: 500,
      status: "FAILED",
      message: "Failed to fetch historical data"
    };
  }
};