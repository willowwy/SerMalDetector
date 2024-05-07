import winston from 'winston';
import path from 'path';

// Define the log file path
const logFilePath = '/home/wwy/SerMalDetector/log/app.log'
//path.join(__dirname, '/home/wwy/SerMalDetector/app.log');

// Create a custom format that strips ANSI codes for file logging
const stripAnsi = winston.format((info) => {
  info.message = info.message.replace(/\x1B\[\d+m/g, '');
  return info;
});

// Configure the Winston logger
const logger = winston.createLogger({
  level: 'info', // Default level
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf((info) => `${info.timestamp}: ${info.level.toUpperCase()}: ${info.message}`),
  ),
  transports: [
    // new winston.transports.Console({
    //   format: winston.format.combine(
    //     winston.format.colorize(), // Add color to the console output
    //     winston.format.printf((info) => `${info.timestamp}: ${info.message}`),
    //   )
    // }),
    new winston.transports.File({
      filename: logFilePath,
      format: winston.format.combine(
        stripAnsi(), // Use the custom format to strip ANSI codes
        winston.format.printf((info) => `${info.timestamp}: ${info.level.toUpperCase()}: ${info.message}`),
      )
    })
  ]
});

// Adjust the logger level at runtime
export const setLogLevel = (level: string) => {
  logger.level = level;
};

export const Logger = {
  info(message: string) {
    logger.info(message);
  },
  warn(message: string) {
    logger.warn(message);  // Note: Winston uses 'warn' instead of 'warning'
  },
  error(message: string) {
    logger.error(message);
  }
}
