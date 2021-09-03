import express from "express";
import cors from "cors";
import { logger } from "../logging.js";

async function getIncomingAddr(req, res, next) {
    const incoming = `${req.socket.remoteAddress.split(":").slice(-1)[0]}:${req.socket.remotePort}`;
    logger.info(`Received ${req.method} ${req.url} from ${incoming}`);
    next();
}

function errorMiddleware(error, req, res, next) {
    if (res.headersSent) {
        next(error);
    } else {
        logger.error(error);
        res.status(500);
        res.json({
            message: error.message,
            // we only add a `stack` property in non-production environments
            ...(process.env.NODE_ENV === "production" ? null : null),
        });
    }
}

function getMiddleware() {
    const router = express.Router();
    router.use(cors());
    router.use(errorMiddleware);
    router.use(getIncomingAddr);
    return router;
}

export default getMiddleware;
