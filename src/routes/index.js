import express from "express";
import getAdminRoutes from "./admin.js";
import getPortfolioRoutes from "./portfolio.js";

export default function getRoutes(client, tokens, config) {
    const router = express.Router();
    router.use("/portfolio", getPortfolioRoutes(client));
    router.use("/admin", getAdminRoutes(tokens, config));
    return router;
}
