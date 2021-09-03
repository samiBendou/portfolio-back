import express from "express";

import getMiddleware from "./middleware.js";
import getPortfolioRoutes from "./portfolio.js";

function getRoutes() {
    const router = express.Router();
    router.use("/", getMiddleware());
    router.use("/portfolio", getPortfolioRoutes());
    return router;
}

export { getRoutes };
