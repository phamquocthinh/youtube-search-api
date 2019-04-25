const mongoose = require('mongoose')
const config = require('../config/mongodb')
const Logger = require('../libs/logger')

module.exports = {
    connect: async () => {
        const { host, port, db } = config

        const mongoUrl = `mongodb://${host}:${port}/${db}`
        const opts = {
            useNewUrlParser: true,
            useFindAndModify: false,
            useCreateIndex: true
        }

        try {
            const conn = await mongoose.connect(mongoUrl, opts)

            Logger.info(`Mongoose connected ${mongoUrl}`)

            process.on('SIGINT', () => {
                conn.connection.close(() => {
                    Logger.warn('Mongoose default connection is disconnected due to application termination')
                    process.exit(0)
                })
            })

            return conn
        } catch (e) {
            Logger.error(e)
            process.exit(1)
        }
    }
}
