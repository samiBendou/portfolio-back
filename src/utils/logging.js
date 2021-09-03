import winston from "winston";
import { performance, PerformanceObserver } from "perf_hooks";

const logLevel = process.env.NODE_ENV !== "production" ? "debug" : "info";

// Logger setup

const { combine, timestamp } = winston.format;
const loggingFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp.slice(0, -5)} | ${level.toUpperCase().padEnd(7)}| ${message}`;
});
export const logger = winston.createLogger({
    level: logLevel,
    format: combine(timestamp(), loggingFormat),
    transports: [new winston.transports.Console()],
});

// Performance observation setup

export const obs = new PerformanceObserver((items) => {
    logger.info(`Done in ${items.getEntries()[0].duration} ms`);
    performance.clearMarks();
});

export { performance };
