import {  getNifty50Service, getTopGainersService } from "../services/nse.service.js";

export const getTopGainersController = async (req, res) => {
  try {
    const result = await getTopGainersService();
    return res.status(result.statusCode).json(result);

  } catch (error) {
    console.error("NSE CONTROLLER ERROR:", error);

    return res.status(500).json({
      status: "FAILED",
      message: "Internal server error"
    });
  }
};


export const getNifty50Controller = async (req, res) => {
  try {
    const result = await getNifty50Service();
    return res.status(result.statusCode).json(result);

  } catch (error) {
    console.error("NIFTY CONTROLLER ERROR:", error);

    return res.status(500).json({
      status: "FAILED",
      message: "Internal server error"
    });
  }
};