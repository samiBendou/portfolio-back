import express from "express";
import { connectToDb } from "../db/index.js";
import { logger } from "../utils/logging.js";
import crypto from "crypto";
import { DbConfig } from "../config.js";
import { updateUser } from "../db/queries.js";

const generateAuthToken = () => {
    return crypto.randomBytes(30).toString("hex");
};

function generateAuth(client, authTokens, config) {
    return async function authenticateUser(req, res) {
        const { username, password } = req.body;
        const user = { username: username, password: password };
        const db = new DbConfig(config.db.host, config.db.port, config.db.name, user);
        try {
            client = await connectToDb(db, client);
            const authToken = generateAuthToken();
            authTokens[authToken] = user;
            client.close();
            res.cookie("AuthToken", authToken);
            res.redirect("/admin");
        } catch (error) {
            logger.warn(error.toString());
            res.redirect("/admin/login");
        }
    };
}

function generateEdit(authTokens, config) {
    return async function editUser(req, res) {
        const user = authTokens[req.cookies["AuthToken"]];
        const db = new DbConfig(config.db.host, config.db.port, config.db.name, user);
        const client = await connectToDb(db);
        if (!user) {
            res.status(403).send("Access forbidden!");
            return;
        }
        console.log(req.body);
        try {
            await updateUser("bendou", req.body, client);
        } catch (error) {
            logger.warn(error.toString());
        }
        res.redirect("/admin");
    };
}

export default function getAdminRoutes(client, authTokens, config) {
    const router = express.Router();
    router.post("/auth", generateAuth(client, authTokens, config));
    router.post("/edit", generateEdit(authTokens, config));
    return router;
}
