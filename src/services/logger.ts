import * as winston from "winston";
import * as Transport from "winston-transport";
import config from "./config.js";

const transports: Transport[] = [];

// Use this to format logs in development enviornment
const devConsoleTransport = new winston.transports.Console({
  stderrLevels: ["error"],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.printf((info) => {
      let { timestamp, level, message, stack } = info;
      return `${level} -> ${timestamp} - ${message}  ${stack ? `\n ${stack}` : ""}`;
    }),
  ),
});

// Use this to format logs in development enviornment
const prodConsoleTransport = new winston.transports.Console({
  stderrLevels: ["error"],
  format: winston.format.combine(
    winston.format.printf((info) => {
      console.log(info);
      let { timestamp, level, message, stack } = info;
      return `${level} ${timestamp} ${message}  ${stack ? `\n ${stack}` : ""}`;
    }),
  ),
});

if (config.NODE_ENV === "development") {
  transports.push(devConsoleTransport);
} else {
  transports.push(prodConsoleTransport);
}

const logger = winston.createLogger({
  level: "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    /**
     * Note:
     * Adding error format in the transport's format will not log error message or stack
     * Could be something to do with how winston uses logform internally
     * Could be because of this: https://github.com/winstonjs/winston/issues/1880#issuecomment-1064498305
     * So we need to add it at the logger level
     */
    winston.format.errors({ stack: true }),
  ),
  transports,
});

export default logger;
