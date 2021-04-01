const version = "1.1.0";
const program = "bendserver"


// Mongo DB server
import mongodb from 'mongodb';
const connect = mongodb.MongoClient.connect;
import {findUser} from './queries.js'

async function getUser(req, res) {
    let user = undefined;
    try {
        user = await findUser(req.params.username, dbclient);
    } catch(err) {
        logger.error(`Failed to get user! ${err}`);
        return res.status(501).send(`Cannot retrieve user ${err.username}`);
    }
    return res.status(200).send(JSON.stringify(user));
}

// Server starting
const start = (port, dbhost, dbport, dbname) => {
    const url = `mongodb://${dbhost}:${dbport}/${dbname}`;

    logger.info(`Connecting to database at ${url}...`)
    connect(url, {useNewUrlParser: true, useUnifiedTopology: true})
        .then(client => {
            logger.info(`Connected successfully to database`);
            dbclient = client;
            const server = https.createServer({key: key, cert: cert}, app).listen(port, () => {
                logger.info(`Listening on port ${server.address().port}...`);
            });
        })
        .catch(err => logger.error(`Failed to connect to database ${err}`));
}

// Argument  parsing

import yargs from 'yargs';
import {hideBin} from 'yargs/helpers'

// Application logger
import winston from 'winston';
const {combine, timestamp} = winston.format;
const loggingFormat = winston.format.printf(({level, message}) => {
    return `${level.toUpperCase()}\t${message}`;
});
const logger = winston.createLogger({
    level: 'info',
    format: combine(timestamp(), loggingFormat),
    transports: [new winston.transports.Console()]
});

// Express Routing
import express from 'express';
import cors from 'cors';
import os from 'os';
import https from 'https';
import fs from 'fs';

const app = express();
const apiEntryPath = '/api/v1';
let dbclient = undefined;

const keyPath = '/etc/letsencrypt/live/portfolio.bendou.space/privkey.pem';
const certPath = '/etc/letsencrypt/live/portfolio.bendou.space/fullchain.pem';
const key = fs.existsSync(keyPath) ? fs.readFileSync(keyPath) : fs.readFileSync('key.pem');
const cert = fs.existsSync(certPath) ? fs.readFileSync(certPath) : fs.readFileSync('cert.pem');

if (!fs.existsSync(certPath)) {
    logger.warn("No public CA found, using self-signed CA...");
}

app.use(cors());
app.get(`${apiEntryPath}/:username`, getUser);
logger.info(`Welcome to ${program} ${version}`)
yargs(hideBin(process.argv))
    .command('serve [port]', 'start the API server', (yargs) => {
        yargs
            .positional('port', {
                describe: 'port to bind on',
                default: 443
            })
    }, (argv) => {
        logger.info(`Starting server on ${os.hostname()} at port ${argv.port}`);
        // noinspection JSUnresolvedVariable
        start(argv.port, argv.dbhost, argv.dbport, argv.dbname);
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
    .strictCommands()
    .argv