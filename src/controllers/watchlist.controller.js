import { addToWatchlist } from "../services/watchlist.service.js";
import { getUserWatchlists } from "../services/watchlist.service.js";
import { removeFromWatchlist } from "../services/watchlist.service.js";


export const addToWatchlistController = async (req, res) => {
  try {
    const { watchlistName, stock } = req.body;

    const userId = req.user.userId; // ✅ FROM JWT

    if (!userId || !watchlistName || !stock || !stock.id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const result = await addToWatchlist({
      userId,
      watchlistName,
      stock,
    });

    return res.json(result);
  } catch (error) {
    console.error("Watchlist Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};



export const getWatchlistController = async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ from JWT

    const result = await getUserWatchlists(userId);

    return res.json(result);
  } catch (error) {
    console.error("Watchlist Fetch Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};




export const removeFromWatchlistController = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { stockId, watchlistName } = req.body;

    if (!stockId || !watchlistName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const result = await removeFromWatchlist({
      userId,
      stockId,
      watchlistName,
    });

    return res.json(result);
  } catch (error) {
    console.error("Remove Watchlist Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};