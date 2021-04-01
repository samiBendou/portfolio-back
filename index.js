const version = "1.1.0";
const program = "bendserver"

// Argument  parsing

const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers')

// Application logger
const winston = require('winston');
const {combine, timestamp} = winston.format;
const loggingFormat = winston.format.printf(({level, message, label, timestamp}) => {
    return `${timestamp}, ${level}: ${message}`;
});
const logger = winston.createLogger({
    level: 'info',
    format: combine(timestamp(), loggingFormat),
    transports: [new winston.transports.Console()]
});

// Mongo DB server
const {connect} = require('mongodb').MongoClient;

// Geolocation
const fetch = require('node-fetch');
const euCountriesApi = "https://restcountries.eu/rest/v2/alpha";
const frGeolocationApi = "https://geo.api.gouv.fr";

const fetchCountry = (location) => {
    const countryUrl = `${euCountriesApi}/${location.country}`;

    logger.info(`Fetching ${countryUrl}...`);
    return new Promise((resolve, reject) => {
        fetch(countryUrl)
            .then(response => response.json())
            .then(data => resolve(data["name"]))
            .catch((err) => reject(`Unable to fetch ${countryUrl} ${err}`));
    });
};

const fetchCounty = (location) => {
    const departmentUrl = `${frGeolocationApi}/departements?code=${location.zip.slice(0, 2)}`;

    logger.info(`Fetching ${departmentUrl}...`);
    return new Promise((resolve, reject) => {
        fetch(departmentUrl)
            .then(response => response.json())
            .then((data) => resolve(data[0]["nom"]))
            .catch((e) => reject(`Unable to fetch ${departmentUrl} ${e}`));
    });
}

const fetchCity = (location) => {
    const cityUrl = `${frGeolocationApi}/communes?codePostal=${location.zip}&format=json`;

    logger.info(`Fetching ${cityUrl}...`);
    return new Promise((resolve, reject) => {
        fetch(cityUrl)
            .then(response => response.json())
            .then(data => resolve(data[0]["nom"]))
            .catch((err) => reject(`Unable to fetch ${cityUrl} ${err}`));
    });
}

const fetchLocation = (location) => {
    logger.info(`Retrieving location ${location.zip}, ${location.country}...`);
    return new Promise((resolve, reject) => {
            Promise.all([fetchCountry(location), fetchCounty(location), fetchCity(location)])
                .then(data => resolve({country: data[0], county: data[1], city: data[2]}))
                .catch(err => reject(err));
        }
    )
};

const fetchTimelineLocation = (items) => {
    return new Promise((resolve, reject) => {
            Promise.all(items.map(item => fetchLocation(item.location)))
                .then(locations => resolve(locations))
                .catch(e => reject(e));
        }
    )
};

// Express Routing
const express = require('express');
const cors = require('cors');
const os = require("os");
const https = require('https');
const fs = require('fs');

const keyPath = process.env.KEY_PATH;
const certPath = process.env.CART_PATH;
const key = fs.existsSync(keyPath) ? fs.readFileSync(keyPath) : fs.readFileSync('key.pem');
const cert = fs.existsSync(certPath) ? fs.readFileSync(certPath) : fs.readFileSync('cert.pem');

if (!fs.existsSync(certPath)) {
    logger.warn("No public CA found, using self-signed CA...");
}

const app = express();
const apiEntryPath = '/api/v1';
let dbclient = undefined;

app.use(cors());
app.get(`${apiEntryPath}/:username`, (req, res) => {
    const users = dbclient.db('portfolio').collection('users');

    logger.info(`Searching username ${req.params.username}...`);
    users.findOne({"username": req.params.username})
        .then(document => {
            if(document === null) {
                throw new Error(`document does not exist`);
            }
            logger.info(`${document.username} found, retrieving location data...`);
            Promise.all([fetchLocation(document.location), fetchTimelineLocation(document.items.timeline)])
                .then((items) => {
                    logger.info("Location data retrieved successfully, sending data...");
                    document.location = items[0];
                    document.items.timeline.forEach((item, index) => item.location = items[1][index]);
                    return JSON.stringify(document);
                })
                .then(json => res.status(200).send(json))
                .catch(err => {
                    logger.error(`Failed to retrieve ${document.location.zip} ${document.location.country}\n${err}`)
                    return res
                        .status(502)
                        .send(`Cannot retrieve location ${document.location.zip} ${document.location.country}`);
                });
        })
        .catch(err => {
            logger.error(`Failed to find ${req.params.username}\n${err}`)
            return res.status(501).send(`Cannot find ${req.params.username}`);
        });
});

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

logger.info(`Welcome to ${program} ${version}`)

// noinspection JSUnresolvedFunction
yargs(hideBin(process.argv))
    .command('serve [port]', 'start the server', (yargs) => {
        yargs
            .positional('port', {
                describe: 'port to bind on',
                default: 5000
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