const Util = require('../libs/utils')
const REDIS_HOST = Util.getEnv('REDIS_HOST', 'localhost')
const REDIS_PORT = Util.getEnv('REDIS_PORT', 59705)
const REDIS_DB = Util.getEnv('REDIS_DB', 0)

module.exports = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    db: REDIS_DB
};
