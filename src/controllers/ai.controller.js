import { getAIAnalysisService } from "../services/ai.service.js";

export const getAIAnalysisController = async (req, res) => {
  try {
    const { name, exchange, snapshot } = req.body;

    if (!snapshot || typeof snapshot !== "object") {
      return res.status(400).json({
        status: "FAILED",
        message: "Market snapshot data is required",
      });
    }

    const result = await getAIAnalysisService({ name, exchange, snapshot });

    return res.status(result.statusCode).json(result);

  } catch (error) {
    console.error("AI CONTROLLER ERROR:", error);

    return res.status(500).json({
      status: "FAILED",
      message: "Internal server error"
    });
  }
};