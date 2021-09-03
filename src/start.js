import { logger, obs, performance } from "./utils/logging.js";
import { AppConfig } from "./config.js";
import { connectToDb } from "./db/index.js";
import { getRoutes } from "./routes/index.js";
import { appName, appVersion } from "./index.js";

import express from "express";
import os from "os";
import https from "https";
import yargs from "yargs";
import dotenv from "dotenv";
import { hideBin } from "yargs/helpers";

function setEnvironment() {
    if (process.env.NODE_ENV !== "production") {
        const result = dotenv.config();
        if (result.error) {
            logger.error(result.error);
            process.exit(9);
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
        logger.error(`Unable to parse configuration ! ${err}`);
        process.exit(1);
    }
}

function serveApp(ca, port, app) {
    let server = https.createServer(ca, app).listen(port, () => {
        logger.info(`Listening on https://localhost:${server.address().port} ...`);
    });
    return server;
}

export default async function startApp(argv) {
    setEnvironment();

    performance.mark("startAppStart");
    obs.observe({ entryTypes: ["measure"] });

    const app = express();
    app.use("/", getRoutes());

    logger.info(`Starting ${appName} ${appVersion} on ${os.hostname()}`);
    const config = parseConfig(argv);
    const db = await connectToDb(config.db);
    const server = serveApp(config.ca, config.port, app);

    server.on("error", (err) => {
        logger.error(`Server error ! ${err}`);
        server.close();
        process.exit(3);
    });

    performance.mark("startAppEnd");
    performance.measure("getUserPerf", "startAppStart", "startAppEnd");
}
