import { fetchMarketStatus } from "../services/marketStatus.service.js";

export const getMarketStatus = async (req, res) => {
  try {
    const result = await fetchMarketStatus();

    return res.status(200).json({
      data: {
        status: "success",
        message: "Market status retrieved successfully",
        ...result,
      },
    });
  } catch (error) {
    console.error("Market Status Error:", error);

    return res.status(500).json({
      data: {
        status: "error",
        message: "Failed to fetch market status",
      },
    });
  }
};