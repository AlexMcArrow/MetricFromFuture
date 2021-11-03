const http = require('http')
const https = require('https')

class CALLER_HTTPPOST {

    /**
     * Constructor
     * @param {path} shell path with regexp
     */
    constructor(path) {
        this.$path = new URL(path)
    }

    /**
     * Make HTTP-POST request
     * @param {string} metric
     * @param {string} level
     * @param {float} value
     */
    ring(metric, level, value) {
        var request
        var agentOptions
        var agent

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

        var payload = JSON.stringify({ metric, level, value })

        var req = request({
            url: this.$path.pathname,
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            },
            agent: agent
        }).on('error', (e) => {
            //TODO: Logging internal error
            console.log('CALLER_HTTPPOST', e);
        })
        req.write(payload)
        req.end()
        return true
    }

}

module.exports = CALLER_HTTPPOST
