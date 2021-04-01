import {FindUserError} from "./errors.js";
import {findUser} from './queries.js';

import mongodb from 'mongodb';

import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import winston from 'winston';

import express from 'express';
import cors from 'cors';
import os from 'os';
import https from 'https';
import {AppConfig} from "./config.js";
import {performance, PerformanceObserver} from 'perf_hooks'

const versionTag = "2.1.0";
const applicationName = "bendserver"

const obs = new PerformanceObserver((items) => {
    logger.info(`Done in ${items.getEntries()[0].duration} ms`);
    performance.clearMarks();
});
const {combine, timestamp} = winston.format;
const loggingFormat = winston.format.printf(({level, message}) => {
    return `${level.toUpperCase()}\t${message}`;
});
const logger = winston.createLogger({
    level: 'info',
    format: combine(timestamp(), loggingFormat),
    transports: [new winston.transports.Console()]
});

const app = express();
const apiEntryPath = '/api/v1';
let dbclient = undefined;

async function getUser(req, res) {
    try {
        logger.info(`Retrieving user ${req.params.username}...`);
        performance.mark("getUserStart");
        const user = await findUser(req.params.username, dbclient);
        performance.mark("getUserEnd");
        logger.info(`Successfully retrieved user ${req.params.username}!`);
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

async function startApp(options) {
    performance.mark("startAppStart");
    const url = `mongodb://${options.db.host}:${options.db.port}/${options.db.name}`;
    logger.info(`Connecting to database at ${url}...`);
    dbclient = await mongodb.MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true})
    logger.info(`Successfully connected to ${url}!`);
    performance.mark("startAppEnd");
    performance.measure("getUserPerf", "startAppStart", "startAppEnd");
    const server = https.createServer(options.ca, app).listen(options.port, () => {
        logger.info(`Listening on port ${server.address().port}...`);
    });
}

app.use(cors());
app.use((req, res, next) => {
    const incoming = `${req["connection"].remoteAddress.split(":").slice(-1)[0]}:${req["connection"].remotePort}`;
    logger.info(`Received ${req.method} ${req.url} from ${incoming}`);
    next();
});
app.get(`${apiEntryPath}/:username`, getUser);

logger.info(`Welcome to ${applicationName} ${versionTag}`);
obs.observe({entryTypes: ['measure']});
yargs(hideBin(process.argv))
    .command('serve [port]', 'start the API server', (yargs) => {
        yargs.positional('port', {describe: 'port to bind on', default: 443})
    }, (argv) => {
        logger.info(`Starting application on ${os.hostname()} at https://localhost:${argv.port}`);
        startApp(AppConfig.FromOptions(argv)).catch(err => logger.error(`Failed to start application! ${err}`));
    })
    .option('dbhost', {
        type: 'string',
        default: 'localhost',
        description: 'Database host if different from localhost'
    })
    .option('dbport', {
        type: 'string',
        default: '27017',
        description: 'Database port if different from default'
    })
    .option('dbname', {
        type: 'string',
        default: 'portfolio',
        description: 'Database name if different from default'
    })
    .option('cakey', {
        type: 'string',
        default: 'key.pem',
        description: 'CA private key if different from self-signed'
    })
    .option('cacert', {
        type: 'string',
        default: 'cert.pem',
        description: 'CA certificate if different from self-signed'
    })
    .strictCommands()
    .argv;