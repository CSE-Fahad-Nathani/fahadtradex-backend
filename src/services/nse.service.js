import axios from "axios";

const BASE_URL = "https://www.nseindia.com";

// 🔥 Create axios instance (important)
const nseClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    Accept: "application/json, text/plain, */*",
    Referer: "https://www.nseindia.com/",
    "X-Requested-With": "XMLHttpRequest"
  }
});

// 🔥 Step 1: Get cookies
const getCookies = async () => {
  const res = await nseClient.get("/");
  return res.headers["set-cookie"];
};

// 🔥 Step 2: Call gainers API
export const getTopGainersService = async () => {
  try {
    const cookies = await getCookies();

    const response = await nseClient.get(
      "/api/live-analysis-variations?index=gainers",
      {
        headers: {
          Cookie: cookies.join(";")
        }
      }
    );

    return {
      statusCode: 200,
      status: "SUCCESS",
      data: response.data
    };

  } catch (error) {
    console.error("NSE GAINERS ERROR:", error.message);

    return {
      statusCode: 500,
      status: "FAILED",
      message: "Failed to fetch top gainers"
    };
  }
};



export const getNifty50Service = async () => {
    try {
      const cookies = await getCookies();
  
      const response = await nseClient.get(
        "/api/equity-stockIndices?index=NIFTY%2050",
        {
          headers: {
            Cookie: cookies.join(";")
          }
        }
      );
  
      return {
        statusCode: 200,
        status: "SUCCESS",
        data: response.data
      };
  
    } catch (error) {
      console.error("NIFTY50 ERROR:", error.message);
  
      return {
        statusCode: 500,
        status: "FAILED",
        message: "Failed to fetch NIFTY 50 data"
      };
    }
  };