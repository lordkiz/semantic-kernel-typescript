import winston, { LoggerOptions } from "winston";

export const Logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    process.env.NODE_ENV !== "production"
      ? new winston.transports.Console({
          format: winston.format.simple(),
        })
      : undefined,
    new winston.transports.File({ filename: "combined.log" }),
  ].filter(Boolean) as LoggerOptions["transports"],
});
