import mongodb from "mongodb";
import { logger } from "../logging.js";

let client = undefined;

async function connectToDb(config) {
    const connectUrl = `mongodb://${config.user.username}:${config.user.password}@${config.host}:${config.port}/${config.name}`;
    const displayUrl = `mongodb://${config.user.username}:********@${config.host}:${config.port}/${config.name}`;
    const dbOptions = { authSource: "admin", useNewUrlParser: true, useUnifiedTopology: true };

    logger.debug(`Connecting to database at ${displayUrl} ...`);
    try {
        client = await mongodb.MongoClient.connect(connectUrl, dbOptions);
    } catch (err) {
        logger.error(`Unable to connect to database ! ${err}`);
        process.exit(2);
    }
    logger.info(`Successfully connected to ${displayUrl}`);
    return client;
}

export { connectToDb, client };
