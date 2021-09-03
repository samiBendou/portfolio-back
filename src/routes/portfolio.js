import { logger, performance } from "../logging.js";
import { FindUserError } from "../errors.js";
import { findUser } from "../db/queries.js";
import express from "express";

async function getUser(req, res) {
    try {
        logger.info(`Retrieving user ${req.params.username} ...`);
        performance.mark("getUserStart");
        const user = await findUser(req.params.username);
        performance.mark("getUserEnd");
        logger.info(`Successfully retrieved user ${req.params.username}`);
        performance.measure("getUserPerf", "getUserStart", "getUserEnd");
        return res.status(200).send(JSON.stringify(user));
    } catch (err) {
        logger.error(`Failed to retrieve user! ${err}`);
        if (err instanceof FindUserError) {
            return res.status(404).send(`${req.params.username} not found`);
        } else {
            return res.status(500).send(`Cannot retrieve user ${req.params.username}`);
        }
    }
}

function getPortfolioRoutes() {
    const router = express.Router();
    router.get("/:username", getUser);
    return router;
}

export default getPortfolioRoutes;
