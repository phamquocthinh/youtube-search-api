const Util = require('../libs/utils')
const MONGODB_HOST = Util.getEnv('MONGODB_HOST', 'localhost')
const MONGODB_PORT = Util.getEnv('MONGODB_PORT', 27017)
const MONGODB_DB = Util.getEnv('MONGODB_DB', 'crawler')

module.exports = {
    host: MONGODB_HOST,
    port: MONGODB_PORT,
    db: MONGODB_DB
};
