import { addStockTarget } from "../services/target.service.js";

export const addStockTargetController = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      symbol,
      name,
      exchange,
      exchangeType,
      scripCode,
      targetPrice,
      initialPrice,
      module,
    } = req.body;

    if (
      !userId ||
      !symbol ||
      !name ||
      !exchange ||
      !exchangeType ||
      !scripCode ||
      targetPrice === undefined ||
      initialPrice === undefined ||
      !module
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (Number.isNaN(Number(targetPrice)) || Number.isNaN(Number(initialPrice))) {
      return res.status(400).json({
        success: false,
        message: "targetPrice and initialPrice must be valid numbers",
      });
    }

    const result = await addStockTarget({
      userId,
      symbol,
      name,
      exchange,
      exchangeType,
      scripCode,
      targetPrice,
      initialPrice,
      module,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Add Stock Target Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
