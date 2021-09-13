import mongodb from "mongodb";
import { ExitCode, FatalError } from "../errors.js";
import { logger } from "../utils/logging.js";

export async function connectToDb(config, client) {
    const connectUrl = `mongodb://${config.user.username}:${config.user.password}@${config.host}:${config.port}/${config.name}`;
    const displayUrl = `mongodb://${config.user.username}:********@${config.host}:${config.port}/${config.name}`;
    const dbOptions = { authSource: "admin", useNewUrlParser: true, useUnifiedTopology: true };

    if (client !== undefined) {
        logger.debug(`Closing client ...`);
        await client.close();
    }

    logger.debug(`Connecting to database at ${displayUrl} ...`);
    try {
        client = await mongodb.MongoClient.connect(connectUrl, dbOptions);
    } catch (err) {
        throw new FatalError(err, ExitCode.FailedConnect, "Unable to connect to database !");
    }
    logger.info(`Successfully connected to ${displayUrl}`);
    return client;
}
