import { logger, obs, performance } from "./utils/logging.js";
import { AppConfig } from "./config.js";
import { connectToDb } from "./db/index.js";
import getRoutes from "./routes/index.js";
import { appName, appVersion } from "./index.js";

import express from "express";
import os from "os";
import https from "https";
import yargs from "yargs";
import dotenv from "dotenv";
import { hideBin } from "yargs/helpers";
import { ExitCode, FatalError } from "./errors.js";

let server = undefined;

function setupEnvironment() {
    if (process.env.NODE_ENV !== "production") {
        const result = dotenv.config();
        if (result.error) {
            throw new FatalError(result.error, ExitCode.BadEnvironment, "Environment error !");
        }
    }
}

function parseConfig() {
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

function serveApp(ca, port, app) {
    server = https.createServer(ca, app).listen(port, () => {
        logger.info(`Listening on https://localhost:${server.address().port} ...`);
    });
    return server;
}

function setupProcessExit(server) {
    async function exitHandler(options = {}) {
        process.exit();
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

        logger.info(`Exiting with code ${code} ...`);
    });
    process.on("SIGINT", exitHandler);
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

export default async function startApp(argv) {
    obs.observe({ entryTypes: ["measure"] });
    performance.mark("startAppStart");

    setupProcessExit(server);

    const app = express();
    app.use("/", getRoutes());

    logger.info(`Starting ${appName} ${appVersion} on ${os.hostname()}`);

    try {
        setupEnvironment();
        const config = parseConfig(argv);
        await connectToDb(config.db);
        serveApp(config.ca, config.port, app);
    } catch (err) {
        if (err instanceof FatalError) {
            logger.error(err.toString());
            process.exit(err.code);
        } else {
            throw err;
        }
    }

    setupServerError(server);

    performance.mark("startAppEnd");
    performance.measure("getUserPerf", "startAppStart", "startAppEnd");
}
