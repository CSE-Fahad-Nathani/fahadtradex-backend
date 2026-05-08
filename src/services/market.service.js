import axios from "axios";

export const getMarketSnapshotService = async ({
  accessToken,
  Exchange,
  ExchangeType,
  ScripCode
}) => {
  try {
    const response = await axios.post(
      "https://Openapi.5paisa.com/VendorsAPI/Service1.svc/MarketSnapshot",
      {
        head: {
          key: process.env.FIVEPAISA_APP_KEY
        },
        body: {
          ClientCode: process.env.FIVEPAISA_CLIENT_CODE,
          Data: [
            {
              Exchange,
              ExchangeType,
              ScripCode
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    return {
      statusCode: 200,
      status: "SUCCESS",
      data: response.data
    };

  } catch (error) {
    console.error("MARKET SNAPSHOT ERROR:", error?.response?.data || error.message);

    return {
      statusCode: 500,
      status: "FAILED",
      message: "Failed to fetch market snapshot"
    };
  }
};