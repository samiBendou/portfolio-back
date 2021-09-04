import winston from "winston";
import { performance, PerformanceObserver } from "perf_hooks";

function createLogger() {
    const isNotProduction = process.env.NODE_ENV !== "production";
    const { combine, timestamp } = winston.format;
    const levels = ["warn", "error"];
    const logLevel = isNotProduction ? "debug" : "info";

    const transports = isNotProduction
        ? [new winston.transports.Console(), new winston.transports.File({ filename: "api.log" })]
        : [new winston.transports.Console()];

    const logging = isNotProduction
        ? ({ level, message, timestamp }) => {
              return `${timestamp.slice(0, -5)} | ${level.toUpperCase().padEnd(7)}| ${message}`;
          }
        : ({ level, message }) => {
              return `${level.toUpperCase().padEnd(7)}| ${message}`;
          };
    return winston.createLogger({
        level: logLevel,
        format: combine(timestamp(), winston.format.printf(logging)),
        transports: transports,
        stderrLevels: levels,
    });
}

// Logger setup

export const logger = createLogger();

// Performance observation setup

export const obs = new PerformanceObserver((items) => {
    logger.info(`Done in ${items.getEntries()[0].duration} ms`);
    performance.clearMarks();
});

export { performance };
