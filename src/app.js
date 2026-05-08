import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import devRoutes from "./routes/dev.routes.js";
import stocksRoutes from "./routes/stocks.routes.js";
import watchlistRoutes from "./routes/watchlist.routes.js";
import portfolioRoutes from "./routes/portfolio.routes.js";
import orderRoutes from "./routes/order.routes.js";
import marketRoutes from "./routes/market.routes.js";
import historicalRoutes from "./routes/historical.routes.js";
import nseRoutes from "./routes/nse.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import targetRoutes from "./routes/target.routes.js";
import marketStatusRoutes from "./routes/marketStatus.routes.js";



dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/stocks", stocksRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/dev", devRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api", portfolioRoutes);
app.use("/api", orderRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/historical", historicalRoutes);
app.use("/api/nse", nseRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/v1/targets", targetRoutes);
app.use("/api/market", marketStatusRoutes);






export default app;