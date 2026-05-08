import { getHistoricalService } from "../services/historical.service.js";

export const getHistoricalController = async (req, res) => {
  try {
    const {
      Exch,
      ExchType,
      ScripCode,
      TimeFrame,
      FromDate,
      ToDate
    } = req.body;

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "FAILED",
        message: "Missing access token"
      });
    }

    const accessToken = authHeader.split(" ")[1];

    // 🔹 Validation
    if (
      !Exch ||
      !ExchType ||
      !ScripCode ||
      !TimeFrame ||
      !FromDate ||
      !ToDate
    ) {
      return res.status(400).json({
        status: "FAILED",
        message: "Missing required fields"
      });
    }

    const result = await getHistoricalService({
      accessToken,
      Exch,
      ExchType,
      ScripCode,
      TimeFrame,
      FromDate,
      ToDate
    });

    return res.status(result.statusCode).json(result);

  } catch (error) {
    console.error("HISTORICAL CONTROLLER ERROR:", error);

    return res.status(500).json({
      status: "FAILED",
      message: "Internal server error"
    });
  }
};