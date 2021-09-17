import express from "express";
import { connectToDb } from "../db/index.js";
import { logger, performance } from "../utils/logging.js";
import { DbConfig, DbUser } from "../config.js";
import { updateUser } from "../db/queries.js";
import jwt from "jsonwebtoken";

const generateAccessToken = (username) => {
    return jwt.sign(username, process.env.JWT_ACCESS_SECRET);
};

const getAccessToken = (req) => {
    const authorization = req.headers["authorization"];
    return authorization && authorization.split(" ")[1];
};

function generateLogUser(tokens, config) {
    return async function logUser(req, res) {
        const { username, password } = req.body;
        const user = new DbUser(username, password);
        const db = new DbConfig(config.db.host, config.db.port, config.db.name, user);
        try {
            performance.mark("authUserStart");
            const client = await connectToDb(db);
            const token = generateAccessToken(user.username);
            tokens[token] = user;
            client.close();
            performance.mark("authUserEnd");
            logger.info(`Authentication of "${user.username}" succeeded`);
            performance.measure("authUserPerf", "authUserStart", "authUserEnd");
            res.status(200).send(token);
        } catch (error) {
            logger.info(`Authentication of "${user.username}" failed`);
            logger.warn(error.message);
            if (error.reason) {
                logger.debug(error.reason.message);
            }
            return res.sendStatus(403);
        }
    };
}

function generateAuthUser(tokens) {
    return function authenticateUser(req, res, next) {
        const token = getAccessToken(req);
        if (!token) {
            return res.sendStatus(401);
        }
        jwt.verify(token, process.env.JWT_ACCESS_SECRET, (error, user) => {
            if (error) {
                logger.warn(error.toString());
                return res.sendStatus(403);
            }
            if (user !== tokens[token].username) {
                logger.warn(`Unauthenticated user "${user}" trying to access admin`);
                return res.sendStatus(401);
            }
            next();
        });
    };
}

function generateCheckAuthUser() {
    return function authenticateUser(req, res) {
        res.sendStatus(200);
    };
}

function generateEditUser(tokens, config) {
    return async function editUser(req, res) {
        const token = getAccessToken(req);
        const user = tokens[token];
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
            res.sendStatus(500);
            return;
        }
        res.sendStatus(200);
    };
}

export default function getAdminRoutes(tokens, config) {
    const router = express.Router();
    router.post("/login", generateLogUser(tokens, config));
    router.use(generateAuthUser(tokens));
    router.post("/auth", generateCheckAuthUser());
    router.post("/edit", generateEditUser(tokens, config));
    return router;
}
