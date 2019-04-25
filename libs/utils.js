const interfaces = require('os').networkInterfaces()
const _ = require('lodash')

let ipAddress

_.each(interfaces, ports => {
    _.each(ports, port => {
        if (!ipAddress && !port.internal && port.family === 'IPv4') {
            ipAddress = port.address
        }
    })
})

module.exports = {
    getEnv: (key, defaultValue) => {
        if (!key) {
            throw new Error('Key is required')
        }

        let value = process.env[key] || ''

        if (!value && defaultValue) {
            value = defaultValue
        }

        return value
    },

    getIpAddress: () => {
        return ipAddress
    }
}
