import { logger, performance } from "../utils/logging.js";
import { FindUserError } from "../errors.js";
import { findUser } from "../db/queries.js";
import express from "express";

function generateGetUser(client) {
    return async function getUser(req, res) {
        let username = req.params.username.toString();
        try {
            logger.info(`Retrieving user ${username} ...`);
            performance.mark("getUserStart");
            const user = await findUser(username, client);
            performance.mark("getUserEnd");
            logger.info(`Successfully retrieved user ${username}`);
            performance.measure("getUserPerf", "getUserStart", "getUserEnd");
            return res.status(200).send(JSON.stringify(user));
        } catch (err) {
            logger.error(err.toString());
            if (err instanceof FindUserError) {
                return res.status(404).send(`${username} not found`);
            } else {
                return res.status(500).send(`Cannot retrieve user ${username}`);
            }
        }
    };
}

export default function getPortfolioRoutes(client) {
    const router = express.Router();
    router.get("/:username", generateGetUser(client));
    return router;
}
