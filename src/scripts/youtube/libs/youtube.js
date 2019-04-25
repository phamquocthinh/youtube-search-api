const {google} = require('googleapis')

const moment = require('moment')
const _ = require('lodash')
const autoBind = require('auto-bind')

class Youtube {
    constructor(apiKey) {
        this.apiKey = apiKey
        this.youtube = google.youtube({ version: 'v3', auth: this.apiKey })

        autoBind(this)
    }

    async search(keyword, posts, nextPage) {
        posts = posts || []

        let params = {
            q: keyword.word,
            part: 'snippet',
            order: 'date',
            type: 'video',
            regionCode: 'VN',
            maxResults: 50
        }

        if (nextPage) {
            params.pageToken = nextPage
        }

        try {
            let { data } = await this.youtube.search.list(params)
            let { items, nextPageToken } = data
            let lastPostTime = this.getLastPostTime(keyword)

            if (!items || !items.length) return posts

            posts = _.concat(posts, _.map(items, this.convertPost))

            if((this.getLastItemTime(items) < lastPostTime) || !nextPageToken) return posts

            return this.search(keyword, posts, nextPageToken)
        } catch (e) {
            throw e
        }
    }

    getLastPostTime(keyword) {
        return keyword.last_post_time ? moment(keyword.last_post_time) : moment().subtract(1, 'month')
    }

    getLastItemTime(items) {
        return moment(items[items.length - 1].snippet.publishedAt)
    }

    convertPost(item) {
        let {snippet, id} = item

        return {
            post_id: id.videoId,
            from: {
                id: snippet.channelId,
                name: snippet.channelTitle
            },
            to: {
                id: snippet.channelId,
                name: snippet.channelTitle
            },
            created_time: moment(snippet.publishedAt).toDate(),
            title: snippet.title,
            message: snippet.description,
            picture: snippet.thumbnails ? snippet.thumbnails.high.url : '',
            url: `https://www.youtube.com/watch?v=${id.videoId}`,
        }
    }
}

module.exports = Youtube
