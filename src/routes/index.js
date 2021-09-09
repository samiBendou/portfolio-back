import express from "express";
import getPortfolioRoutes from "./portfolio.js";

export default function getRoutes() {
    const router = express.Router();
    router.use("/portfolio", getPortfolioRoutes());
    return router;
}
