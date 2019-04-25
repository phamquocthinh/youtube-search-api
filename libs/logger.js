const { createLogger, format, transports } = require('winston')
const { combine, timestamp, colorize, printf } = format

const logger = createLogger({
    format: combine(
        colorize(),
        timestamp(),
        printf(info => `${info.level}: [${info.timestamp}] ${info.message}`)
    ),
    transports: [new transports.Console()]
})

module.exports = logger
  