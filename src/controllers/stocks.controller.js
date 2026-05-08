import { searchStocks, buyStockService } from "../services/stocks.service.js";
import { getStockByScrip } from "../services/stocks.service.js";

// 🔍 SEARCH STOCKS (existing)
export const searchStocksController = async (req, res) => {
  try {
    const { name, exch = "ALL" } = req.query;

    const data = await searchStocks({ name, exch });

    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Search Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getStockDetailsController = async (req, res) => {
  try {
    const { scripCode, exch, exchType } = req.query;

    if (!scripCode || !exch || !exchType) {
      return res.status(400).json({
        success: false,
        message: "Missing required params",
      });
    }

    const data = await getStockByScrip({
      scripCode,
      exch,
      exchType,
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Stock not found",
      });
    }

    return res.json({
      success: true,
      data,
    });

  } catch (error) {
    console.error("Stock Details Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


// 🔥 BUY STOCK (EQ + MCX)
export const buyStockController = async (req, res) => {
  try {
    const userId = req.user.userId;
    const payload = req.body;

    const isMCX = payload.Exch === "M";

    // 🔹 Validation
    if (
      !payload.ScripCode ||
      !payload.Exch ||
      !payload.ExchType ||
      !payload.symbol ||
      !payload.name ||
      !payload.LTP
    ) {
      return res.status(400).json({
        status: "FAILED",
        message: "Missing required fields"
      });
    }

    if (isMCX) {
      if (!payload.lots || !payload.multiplier) {
        return res.status(400).json({
          status: "FAILED",
          message: "Missing lots or multiplier for MCX"
        });
      }
    } else {
      if (!payload.Quantity) {
        return res.status(400).json({
          status: "FAILED",
          message: "Quantity required"
        });
      }
    }

    if (payload.LTP <= 0) {
      return res.status(400).json({
        status: "FAILED",
        message: "Invalid Price"
      });
    }

    const result = await buyStockService({
      userId,
      payload
    });

    return res.status(result.statusCode).json(result);

  } catch (error) {
    console.error("BUY CONTROLLER ERROR:", error);

    return res.status(500).json({
      status: "FAILED",
      message: "Internal server error"
    });
  }
};

export const sellStockController = async (req, res) => {
  try {
    const userId = req.user.userId;
    const payload = req.body;

    const isMCX = payload.Exch === "M";

    // 🔹 Basic Validation
    if (
      !payload.ScripCode ||
      !payload.Exch ||
      !payload.ExchType ||
      !payload.symbol ||
      !payload.name ||
      !payload.LTP
    ) {
      return res.status(400).json({
        status: "FAILED",
        message: "Missing required fields"
      });
    }

    if (isMCX) {
      if (!payload.lots || !payload.multiplier) {
        return res.status(400).json({
          status: "FAILED",
          message: "Missing lots or multiplier for MCX"
        });
      }
    } else {
      if (!payload.Quantity) {
        return res.status(400).json({
          status: "FAILED",
          message: "Quantity required"
        });
      }
    }

    if (payload.LTP <= 0) {
      return res.status(400).json({
        status: "FAILED",
        message: "Invalid Price"
      });
    }

    const { sellStockService } = await import("../services/stocks.service.js");

    const result = await sellStockService({
      userId,
      payload
    });

    return res.status(result.statusCode).json(result);

  } catch (error) {
    console.error("SELL CONTROLLER ERROR:", error);

    return res.status(500).json({
      status: "FAILED",
      message: "Internal server error"
    });
  }
};