import { logger, obs, performance } from "./utils/logging.js";
import { AppConfig } from "./config.js";
import { connectToDb } from "./db/index.js";
import getRoutes from "./routes/index.js";
import getMiddleware from "./routes/middleware.js";
import { appName, appVersion } from "./index.js";

import express from "express";
import os from "os";
import https from "https";
import http from "http";
import yargs from "yargs";
import dotenv from "dotenv";
import { hideBin } from "yargs/helpers";
import { ExitCode, FatalError } from "./errors.js";
import path from "path";

let server = undefined;
let insecure = undefined;
let client = undefined;
const tokens = {};

function setupEnvironment() {
    if (process.env.NODE_ENV !== "production") {
        const result = dotenv.config();
        if (result.error) {
            throw new FatalError(result.error, ExitCode.BadEnvironment, "Environment error !");
        }
    }
}

function setupAppRoutes(config) {
    const app = express();

    app.use("/", getMiddleware());
    app.use("/", express.static(`../portfolio-front/build`));
    app.use("/api", getRoutes(client, tokens, config));
    app.get("/*", (req, res) => {
        res.sendFile(path.resolve("../portfolio-front/build/index.html"));
    });
    return app;
}

function setupConfig() {
    let argv = undefined;
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
            (args) => (argv = args)
        )
        .option("dbname", {
            type: "string",
            default: "portfolio",
            description: "Database name if different from default",
        })
        .strictCommands().argv;

    try {
        return AppConfig.FromOptions(argv, process.env);
    } catch (err) {
        throw new FatalError(err, ExitCode.BadConfig, "Unable to parse configuration !");
    }
}

function setupServer(ca, port, app) {
    const httpPort = port != 443 ? port + 1 : 80;
    server = https.createServer(ca, app).listen(port, () => {
        logger.info(`Listening on https://localhost:${server.address().port} ...`);
    });
    insecure = http.createServer(app).listen(httpPort, () => {
        logger.info(`Listening on http://localhost:${insecure.address().port} ...`);
    });
    return server;
}

function setupProcessExit() {
    async function exitHandler(code) {
        code = code instanceof Error ? 1 : code;
        process.exit(code);
    }

    process.on("exit", (code) => {
        if (server !== undefined) {
            try {
                server.close();
                logger.info("Server successfully closed");
            } catch (err) {
                logger.warn("Something went wrong closing the server", err.stack);
            }
        }
        const attribute = code instanceof String ? "signal" : "code";
        logger.info(`Exiting with ${attribute} ${code} ...`);
    });
    process.on("SIGINT", exitHandler);
    process.on("SIGTERM", exitHandler);
    process.on("SIGUSR1", exitHandler);
    process.on("SIGUSR2", exitHandler);
    process.on("uncaughtException", exitHandler);
}

function setupServerError(server) {
    server.on("error", (err) => {
        const fatal = new FatalError(err, ExitCode.ServerError, "Server encountered an error !");
        logger.error(fatal.toString());
        process.exit(fatal.code);
    });
}

export default async function serve(argv) {
    obs.observe({ entryTypes: ["measure"] });
    performance.mark("startAppStart");

    logger.info(`Starting ${appName} ${appVersion} on ${os.hostname()}`);

    try {
        setupEnvironment();
        const config = setupConfig(argv);
        setupProcessExit();
        client = await connectToDb(config.db);
        const app = setupAppRoutes(config);
        setupServer(config.ca, config.port, app);
        setupServerError(server);
    } catch (err) {
        if (err instanceof FatalError) {
            logger.error(err.toString());
            process.exit(err.code);
        } else {
            throw err;
        }
    }

    performance.mark("startAppEnd");
    performance.measure("getUserPerf", "startAppStart", "startAppEnd");
}
