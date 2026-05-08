import { getMarketSnapshotService } from "../services/market.service.js";

export const getMarketSnapshotController = async (req, res) => {
  try {
    const { Exchange, ExchangeType, ScripCode } = req.body;

    // 🔥 token from frontend header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "FAILED",
        message: "Missing 5Paisa access token"
      });
    }

    const accessToken = authHeader.split(" ")[1];

    // 🔹 validation
    if (!Exchange || !ExchangeType || !ScripCode) {
      return res.status(400).json({
        status: "FAILED",
        message: "Missing required fields"
      });
    }

    const result = await getMarketSnapshotService({
      accessToken,
      Exchange,
      ExchangeType,
      ScripCode
    });

    return res.status(result.statusCode).json(result);

  } catch (error) {
    console.error("MARKET CONTROLLER ERROR:", error);

    return res.status(500).json({
      status: "FAILED",
      message: "Internal server error"
    });
  }
};