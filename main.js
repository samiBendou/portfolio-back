import {FetchLocationError, FindUserError} from "./errors.js";
import {findUser} from './queries.js';

import mongodb from 'mongodb';

import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import winston from 'winston';

import express from 'express';
import cors from 'cors';
import os from 'os';
import https from 'https';
import {ConfigFromOptions} from "./config.js";

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

const version = "2.0.0";
const program = "bendserver"

async function getUser(req, res) {
    let user = undefined;
    try {
        user = await findUser(req.params.username, dbclient);
        res.statusCode = 200;
    } catch(err) {
        if(err instanceof FetchLocationError) {
            res.statusCode = 500;
        } else if(err instanceof FindUserError) {
            res.statusCode = 404;
        }
        logger.error(`Failed to retrieve user! ${err}`);
        return res.send(`Cannot retrieve user ${req.params.username}`);
    }
    logger.info(`Successfully retrieved user ${req.params.username}`);
    return res.send(JSON.stringify(user));
}

async function startApp(options) {
    const url = `mongodb://${options.db.host}:${options.db.port}/${options.db.name}`;
    logger.info(`Connecting to database at ${url}...`);
    dbclient = await mongodb.MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true})
    logger.info(`Connected successfully to database`);
    const server = https.createServer(options.ca, app).listen(options.port, () => {
        logger.info(`Listening on port ${server.address().port}...`);
    });
}

logger.info(`Welcome to ${program} ${version}`);
app.use(cors());
app.get(`${apiEntryPath}/:username`, getUser);
yargs(hideBin(process.argv))
    .command('serve [port]', 'start the API server', (yargs) => {
        yargs
            .positional('port', {
                describe: 'port to bind on',
                default: 443
            })
    }, (argv) => {
        logger.info(`Starting server on ${os.hostname()} at https://localhost:${argv.port}`);
        startApp(ConfigFromOptions(argv)).catch(err => logger.error(`Failed to start application! ${err}`));
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