import {
  getUserPositions,
  getUserPortfolio,
} from "../services/portfolio.service.js";

// ========================================
// 📊 GET POSITIONS
// ========================================
export const getPositionsController = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID missing",
      });
    }

    // const positions = await getUserPositions(userId);
    const token = req.headers.authorization?.split(" ")[1];

    const positions = await getUserPositions(userId, token);

    return res.json({
      success: true,
      count: positions.length,
      data: positions,
    });
  } catch (error) {
    console.error("Positions Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch positions",
    });
  }
};

// ========================================
// 💼 GET PORTFOLIO
// ========================================
export const getPortfolioController = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID missing",
      });
    }

    const portfolio = await getUserPortfolio(userId);

    return res.json({
      success: true,
      count: portfolio.length,
      data: portfolio,
    });
  } catch (error) {
    console.error("Portfolio Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch portfolio",
    });
  }
};