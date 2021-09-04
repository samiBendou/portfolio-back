import express from "express";

import getMiddleware from "./middleware.js";
import getPortfolioRoutes from "./portfolio.js";

export default function getRoutes() {
    const router = express.Router();
    router.use("/portfolio", getPortfolioRoutes());
    return router;
}
