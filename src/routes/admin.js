import express from "express";
import { connectToDb } from "../db/index.js";
import { logger, performance } from "../utils/logging.js";
import crypto from "crypto";
import { DbConfig, DbUser } from "../config.js";
import { updateUser } from "../db/queries.js";

const generateAuthToken = () => {
    return crypto.randomBytes(30).toString("hex");
};

function generateAuthUser(tokens, config) {
    return async function authenticateUser(req, res) {
        const { username, password } = req.body;
        const user = new DbUser(username, password);
        const db = new DbConfig(config.db.host, config.db.port, config.db.name, user);
        try {
            performance.mark("authUserStart");
            const client = await connectToDb(db);
            const authToken = generateAuthToken();
            tokens[authToken] = user;
            client.close();
            performance.mark("authUserEnd");
            logger.info(`Authentication of "${user.username}" succeeded`);
            performance.measure("authUserPerf", "authUserStart", "authUserEnd");
            res.cookie("AuthToken", authToken).sendStatus(200);
        } catch (error) {
            logger.info(`Authentication of "${user.username}" failed`);
            logger.warn(error.message);
            if (error.reason) {
                logger.debug(error.reason.message);
            }
            res.sendStatus(403);
            return;
        }
    };
}

function generateEditUser(tokens, config) {
    return async function editUser(req, res) {
        const user = tokens[req.cookies["AuthToken"]];
        if (!user) {
            logger.warn(`Unauthenticated user attempting to edit`);
            res.status(403).send("Access forbidden!");
            return;
        }
        logger.info(`Edition requested by ${user.username}`);
        performance.mark("editUserStart");
        const db = new DbConfig(config.db.host, config.db.port, config.db.name, user);
        const client = await connectToDb(db);
        try {
            await updateUser("bendou", req.body, client);
            client.close();
            performance.mark("editUserEnd");
            performance.measure("editUserPerf", "editUserStart", "editUserEnd");
        } catch (error) {
            logger.warn(error.message);
        }
        res.sendStatus(200);
    };
}

export default function getAdminRoutes(tokens, config) {
    const router = express.Router();
    router.post("/auth", generateAuthUser(tokens, config));
    router.post("/edit", generateEditUser(tokens, config));
    return router;
}
