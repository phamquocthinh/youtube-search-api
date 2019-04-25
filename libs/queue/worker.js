const _ = require('lodash')
const kue = require('kue')
const autoBind = require('auto-bind')

const config = require('../../config/redis')

const queue = kue.createQueue({
    redis: config
})

queue.setMaxListeners(999)

// handle sighup event and graceful shutdown
process.on('SIGHUP', () => {
    console.log('Receive SIGHUP event...')

    queue.shutdown(5000, () => {
        process.exit(0)
    })
})

class QueueWorker {
    constructor(channel, concurrency) {
        this.channel = channel
        this.concurrency = concurrency
        autoBind(this)
    }

    execute(cb) {
        if (!this.channel) {
            throw new Error('Channel is required')
        }

        queue.process(this.channel, this.concurrency, (job, done) => {
            cb(job, done)
        })
    }
}

module.exports = QueueWorker