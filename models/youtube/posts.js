const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const moment = require('moment')

const Schema = mongoose.Schema
const Posts = new Schema({
    post_id: {
        type: String,
        required: true,
        unique: true
    },
    from: Schema.Types.Mixed,
    to: Schema.Types.Mixed,
    url: String,
    title: String,
    message: String,
    description: String,
    picture: String,
    created_time: Date,
    inserted_time: Date,
    updated_time: Date,
    ds: Schema.Types.Mixed,
    is_disabled: Number,
    error: Schema.Types.Mixed,
    next_page: String
},{ collection: 'youtube_posts' })

Posts.statics.findPostsBatch = function(lastId, batch) {
    let condition = {
        is_disabled: {$ne: 1},
        created_time: {$gte: moment().subtract(30, 'days').toDate()},
        //updated_time: {$gte: moment().subtract(15, 'days').toDate()},
    }

    if (lastId) condition._id = { $lt: new ObjectId(lastId) }

    return this.find(condition).sort('-_id').limit(batch)
}

module.exports = mongoose.model('youtubePosts', Posts)
