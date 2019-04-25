'use strict'

const _ = require('lodash')
const moment = require('moment')
const Promise = require('bluebird')

const rootPath = '../../..'
const MongoDb = require(rootPath + '/libs/mongodb')
const Logger = require(rootPath + '/libs/logger')
const Util = require(rootPath + '/libs/utils')

const Keywords = require(rootPath + '/models/youtube/keywords')
const Posts = require(rootPath + '/models/youtube/posts')

const Youtube = require('./libs/youtube')
const youtube = new Youtube()

process.on('uncaughtException', error => {
    Logger.error(error)
    process.exit(1)
})

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
} 

const getKeywords = async() => {
    try {
        let keywords = await Keywords.find({ is_disabled: { $ne: 1 } })

        const filterKeyword = (kw) => {
            if (!kw.last_request_time || Math.abs(moment().diff(moment(kw.last_request_time), 'minutes')) > kw.period) {
                return kw
            }
        }

        return _.compact(_.map(keywords, filterKeyword))
    } catch(e) {
        throw e
    }
}

const processKeyword = async(keyword) => {
    Logger.info(`Processing keyword ${keyword.word}`)
    try {
        let posts = []

        posts = await youtube.search(keyword)

        if (!posts || !posts.length) return

        let lastPostTime = posts[0].created_time
        posts = _.map(posts, post => addDataSource(post, keyword.word))

        Logger.info(`Found total ${posts.length} posts`)

        await insertPost(posts)
        await updateKeyword(keyword, lastPostTime)
    } catch(e) {
        throw e
    }
}

const addDataSource = (post, word) => {
    return {...post, ...{
        crawled: 1,
        inserted_time: moment().toDate(),
        ds: {
            source: 'youtube-search',
            keyword: word,
            ip: Util.getIpAddress()
        }
    }}
}

const insertPost = (posts) => {
    return Posts.insertMany(posts, { ordered: false }, err => {
        if(err && err.code !== 11000) {
            throw err
        }
    })
}

const updateKeyword = (keyword, lastPostTime) => {
    return Keywords.findOneAndUpdate({word: keyword.word}, {
        last_post_time: moment(lastPostTime).toDate(),
        last_request_time: moment().toDate()
    })
}

const start = async() => {
    try {
        await MongoDb.connect()
        let keywords = await getKeywords()

        await Promise.each(keywords, processKeyword)
        await sleep(10000)

        Logger.info(`All keywords processed, Exiting... `)

        process.exit()
    } catch(e) {
        Logger.error(e)
    }
}

start()