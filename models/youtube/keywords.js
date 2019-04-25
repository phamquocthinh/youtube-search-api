const mongoose = require('mongoose')

const Schema = mongoose.Schema
const Keywords = new Schema({
    word: String,
    created_time: Date,
    period: Number,
    last_request_time: Date,
    last_post_time: Date
},{ collection: 'youtube_keywords' })

module.exports = mongoose.model('youtubeKeywords', Keywords)
