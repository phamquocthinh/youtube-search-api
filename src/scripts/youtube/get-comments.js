'use strict'

const _ = require('lodash')
const moment = require('moment')
const Promise = require('bluebird')

const rootPath = '../../..'
const MongoDb = require(rootPath + '/libs/mongodb')
const Logger = require(rootPath + '/libs/logger')
const Util = require(rootPath + '/libs/utils')

const Comments = require(rootPath + '/models/youtube/comments')
const Posts = require(rootPath + '/models/youtube/posts')

const Youtube = require('./libs/youtube')
const youtube = new Youtube('AIzaSyDebYQAMT3gdtkXCTapSq19LGFuGR7SjK0')

process.on('uncaughtException', error => {
    Logger.error(error)
    process.exit(1)
})

class Master extends QueueMaster {
    constructor(channel, options) {
        super(channel, options)
        this.totalJobsAdded = 0
        this.limitJobs = 5000
        this.limitInactiveJobs = 100

        this.lastId = null
        this.batch = 100
    }

    getPosts(lastId, batch) {
        return Posts.findPosts(lastId, batch)
    }

    addUrl(data) {
        return this.addJob(data)
            .then(job => {
                job.on('failed attempt', () => {
                    job.remove(rmError => {
                        if (rmError) {
                            console.log(rmError)
                        }
                    })
                })

                job.on('failed', () => {
                    job.remove(rmError => {
                        if (rmError) {
                            console.log(rmError)
                        }
                    })
                })

                return Promise.resolve()
            }).catch(error => Promise.reject(error))
    }

    async start() {
        let urls = await this.getUrls()

        return Promise.map(urls, async(item) => {
            await Urls.update({ id: item.id }, { isAddedToQueue: true })
            let {
                id,
                site_name: siteName,
                url,
                inserted_at: insertedAt,
                importedRow
            } = item

            return this.addUrl({title: siteName, siteName, url, insertedAt, importedRow, id})
        }).then(() => {
            if (this.totalUrlsAdded > this.limitUrls) {
                return this.exitProcess(0)
            }

            return Promise.resolve()
        }).catch(error => Promise.reject(error))
    }

    async execute() {
        this.startProfiling()

        if (await this.canAddJobs(this.limitInactiveJobs)) {
            await this.start()
            await this.sleep(2000)
            
            return this.execute()
        }
        await this.sleep(5 * 1000)

        return this.execute()
    }
}

const channel = 'get-articles'
const options = {
    attempts: 1,
    profiling: {
        enable: true,
        jobs: 100,
        type: 'articles'
    }
}
const articleMaster = new ArticleMaster(channel, options)

MongoDb.connect()
    .then(articleMaster.execute())
