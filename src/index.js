import { logger } from "./logging.js";
import startApp from "./start.js";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
    const result = dotenv.config();
    if (result.error) {
        logger.error(result.error);
        process.exit(9);
    }
}

startApp();
