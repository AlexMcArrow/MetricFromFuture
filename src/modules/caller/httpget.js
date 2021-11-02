const http = require('http')
const https = require('https')

class CALLER_HTTPGET {

    /**
     * Constructor
     * @param {path} shell path with regexp
     */
    constructor(path) {
        this.$path = new URL(path)
    }

    /**
     * Make HTTP-GET request
     * @param {string} metric
     * @param {string} level
     * @param {float} value
     * @returns boolean
     */
    ring(metric, level, value) {
        var request
        var agentOptions
        var agent

        var line = this.$path.href
        line = line.replace(/\$1/g, metric)
        line = line.replace(/\$2/g, level)
        line = line.replace(/\$3/g, value)

        agentOptions = {
            host: this.$path.hostname,
            path: '/',
            rejectUnauthorized: false
        }

        switch (this.$path.protocol) {
            case 'https:':
                agent = new https.Agent(agentOptions)
                agent.options.port = this.$path.port || 443
                request = https.request
                break
            case 'http:':
                agent = new http.Agent(agentOptions)
                agent.options.port = this.$path.port || 80
                request = http.request
                break

            default:
                return false
                break
        }

        request({
            url: line,
            method: "GET",
            agent: agent
        }).on('error', (e) => {
            //TODO: Logging internal error
            console.log('CALLER_HTTPGET', e);
        }).end()


        return true
    }

}

module.exports = CALLER_HTTPGET
