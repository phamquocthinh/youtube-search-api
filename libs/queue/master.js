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

class QueueMaster {
    constructor(channel, options) {
        const defaults = {
            profiling: {
                enable: true,
                jobs: 1000,
            },
            ttl: 1000 * 60 * 30,  // 30 mins
            priority: 'normal',
            attempts: 3,
            backoff: {
                delay: 1000 * 60    // 1 min
            },
            remove_on_complete: true
        }

        this.channel = channel
        this.settings = _.extend(defaults, options)
        this.processedJobs = 0
        this.startTime
        this.endTime
        autoBind(this)
    }

    getQueue() {
        return queue
    }

    addJob(data) {
        let job = this.getQueue().create(this.channel, data)

        job.ttl(this.settings.ttl)
        job.priority(this.settings.priority)

        if (this.settings.attempts) {
            job.attempts(this.settings.attempts)

            if (this.settings.backoff.delay) {
                job.backoff({ delay: this.settings.backoff.delay, type: 'fixed' })
            }
        }

        if (this.settings.remove_on_complete) {
            job.removeOnComplete(true)
        }

        return new Promise((resolve, reject) => {
            job.save((error) => {
                if (error) {
                    return reject(error)
                }

                resolve(job)
            })
        }).then(job => {
            if (this.settings.profiling.enable) {
                job.on('complete', () => {
                    this.processedJobs++

                    if (this.processedJobs === this.settings.profiling.jobs) {
                        this.endProfiling(this.settings.profiling.type)

                        this.startTime = process.uptime()

                        this.processedJobs = 0
                    }
                })
            }

            return job
        })
    }

    startProfiling() {
        if (!this.startTime) {
            
            this.startTime = process.uptime()
        }
    }

    endProfiling(type) {
        this.endTime = process.uptime()
        let duration = +parseFloat(this.endTime - this.startTime).toFixed(2)

        let avgSpeed = +parseFloat(this.processedJobs / duration).toFixed(2)

        console.log(`=SPEED= ${this.processedJobs} ${type} / ${duration} s (Avg: ${avgSpeed}/ s)`)
    }

    getTotalInactiveJobs() {
        return new Promise((resolve, reject) => {
            this.getQueue().inactiveCount(this.channel, (error, total) => {
                if (error) {
                    return reject(error)
                }

                resolve(total)
            })
        })
    }

    getTotalActiveJobs() {
        return new Promise((resolve, reject) => {
            this.getQueue().activeCount(this.channel, (error, total) => {
                if (error) {
                    return reject(error)
                }

                resolve(total)
            })
        })
    }

    async canAddJobs(inactiveLimit, activeLimit) {
        let inactiveJobs = 0, activeJobs = 0
        activeLimit = activeLimit || 1000
        try {
            inactiveJobs = await this.getTotalInactiveJobs()
            activeJobs = await this.getTotalActiveJobs()
        } catch (e) {
            console.log(e)
        }

        console.log(`INACTIVE JOBS: ${inactiveJobs}`)
        console.log(`ACTIVE JOBS: ${activeJobs}`)

        return (inactiveJobs < inactiveLimit) && (activeJobs < activeLimit) 
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    } 

    exitProcess(code) {
        console.log('Exitting...')
        process.exit(code)
    }
}

module.exports = QueueMaster