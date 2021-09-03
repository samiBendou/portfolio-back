import { FindUserError } from "./errors.js";
import { findUser } from "./queries.js";

import mongodb from "mongodb";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import winston from "winston";
import dotenv from "dotenv";

import express from "express";
import cors from "cors";
import os from "os";
import https from "https";
import { AppConfig } from "./config.js";
import { performance, PerformanceObserver } from "perf_hooks";

// Application version information

const debug = process.env.NODE_ENV !== "production";
const versionTag = "2.3.0";
const applicationName = "bendserver";

// Environnement setup

if (debug) {
    const result = dotenv.config();
    if (result.error) {
        throw result.error;
    }
}

// Logger setup

const { combine, timestamp } = winston.format;
const loggingFormat = winston.format.printf(({ level, message }) => {
    return `${level.toUpperCase()}\t${message}`;
});
const logger = winston.createLogger({
    level: debug ? "debug" : "info",
    format: combine(timestamp(), loggingFormat),
    transports: [new winston.transports.Console()],
});

// Performance observation setup

const obs = new PerformanceObserver((items) => {
    logger.silly(`Done in ${items.getEntries()[0].duration} ms`);
    performance.clearMarks();
});
obs.observe({ entryTypes: ["measure"] });

function parseConfig(argv) {
    try {
        config = AppConfig.FromOptions(argv, process.env);
    } catch (err) {
        logger.error(`Unable to parse configuration ! ${err}`);
        process.exit(1);
    }
}

function connectToDb(config) {
    const connectUrl = `mongodb://${config.user.username}:${config.user.password}@${config.host}:${config.port}/${config.name}`;
    const displayUrl = `mongodb://${config.user.username}:********@${config.host}:${config.port}/${config.name}`;
    const dbOptions = { authSource: "admin", useNewUrlParser: true, useUnifiedTopology: true };

    logger.debug(`Connecting to database at ${displayUrl} ...`);
    db = mongodb.MongoClient.connect(connectUrl, dbOptions).catch((err) => {
        logger.error(`Unable to connect to database ! ${err}`);
        process.exit(2);
    });
    logger.info(`Successfully connected to ${displayUrl}`);
}

function serveApp(ca, port) {
    server = https.createServer(ca, app).listen(port, () => {
        logger.info(`Listening on port ${server.address().port} ...`);
    });

    server.on("error", (err) => {
        logger.error(`Server error ! ${err}`);
        server.close();
        process.exit(3);
    });
}

function startApp(argv) {
    performance.mark("startAppStart");
    logger.debug(`Starting application on ${os.hostname()} at https://localhost:${argv.port}`);
    parseConfig(argv);
    connectToDb(config.db);
    serveApp(config.ca, config.port);
    performance.mark("startAppEnd");
    performance.measure("getUserPerf", "startAppStart", "startAppEnd");
}

// Routes

async function getUser(req, res) {
    try {
        logger.info(`Retrieving user ${req.params.username} ...`);
        performance.mark("getUserStart");
        const user = await findUser(req.params.username, db);
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

async function getIncomingAddr(req, res, next) {
    const incoming = `${req.socket.remoteAddress.split(":").slice(-1)[0]}:${req.socket.remotePort}`;
    logger.info(`Received ${req.method} ${req.url} from ${incoming}`);
    next();
}

// Express application setup

const app = express();

// Middleware setup

app.use(cors());
app.use(getIncomingAddr);

// Routes

app.get(`portfolio/:username`, getUser);

// Database connection setup

let db = undefined;

// Server listening setup

let server = undefined;

// Application config setup

let config = undefined;

// Entry point

logger.info(`Welcome to ${applicationName} ${versionTag}`);

yargs(hideBin(process.argv))
    .command(
        "serve [port]",
        "start the API server",
        (yargs) => {
            yargs.positional("port", {
                describe: "port to bind on",
                default: 443,
            });
        },
        startApp
    )
    .option("dbname", {
        type: "string",
        default: "portfolio",
        description: "Database name if different from default",
    })
    .strictCommands().argv;
