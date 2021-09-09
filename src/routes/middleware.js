import express from "express";
import cors from "cors";
import { logger } from "../utils/logging.js";

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
            ...(process.env.NODE_ENV === "production" ? null : { stack: error.stack }),
        });
    }
}

function ensureSecure(error, req, res, next) {
    if (req.secure) {
        return next();
    }
    res.redirect("https://" + req.hostname + req.url); // express 4.x
}

export default function getMiddleware() {
    const router = express.Router();
    router.use(cors());
    router.use(ensureSecure);
    router.use(errorMiddleware);
    router.use(getIncomingAddr);
    return router;
}
