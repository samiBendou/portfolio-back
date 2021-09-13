import express from "express";
import getAdminRoutes from "./admin.js";
import getPortfolioRoutes from "./portfolio.js";

export default function getRoutes(readerClient, adminClient, authTokens, config) {
    const router = express.Router();
    router.use("/portfolio", getPortfolioRoutes(readerClient));
    router.use("/admin", getAdminRoutes(adminClient, authTokens, config));
    return router;
}
