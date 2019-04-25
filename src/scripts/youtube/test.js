const Logger = require('../../../libs/logger')
const rootPath = '../../..'
const MongoDb = require(rootPath + '/libs/mongodb')
const Posts = require(rootPath + '/models/youtube/posts')


const test = async() => {
    await MongoDb.connect()
    await func(null)
}

const func = async(lastId) => {
    let posts = await Posts.findPostsBatch(lastId, 100)

    if (!posts.length) return process.exit()

    Logger.info(posts.length)
    lastId = posts[posts.length - 1]._id
    Logger.info(lastId)

    return func(lastId)
}

test()