const http = require('http')
const assert = require('assert')

const PARSE_ERROR = -32700
const INVALID_REQUEST = -32600
const METHOD_NOT_FOUND = -32601
const INVALID_PARAMS = -32602
const SERVER_ERROR = -32000
const SERVER_ERROR_MAX = -32099
const INVALID_ACCEPT_HEADER_MSG = 'Accept header must include application/json'
const INVALID_CONTENT_LENGTH_MSG = 'Invalid Content-Length header'
const callbackNames = ['onRequest', 'onRequestError', 'onResult', 'onServerError']

class RPC_JSON {

    /**
     * Constructor
     * @param {Object} config for listen
     */
    constructor(config, pipe) {
        this.$active = config.active
        this.$dsn = config.dsn
        this.$pipe = pipe
        this.$rpc = null
    }

    /**
     * Start listen
     */
    start() {
        console.log('RPC', 'JSON', 'start', this.$dsn)
        if (this.$active) {
            this.$rpc = new RpcServer({
                path: this.$dsn.path,
                onRequest: (request) => {
                    console.log('RPC', 'JSON', 'onRequest', JSON.stringify(request))
                },
                onRequestError: (err, id) => {
                    console.error('RPC', 'JSON', 'onRequestError', 'request ' + id + ' threw an error: ' + err)
                },
                onResult: (result, id) => {
                    console.log('RPC', 'JSON', 'onResult', result)
                },
                onServerError: (err) => {
                    console.error('RPC', 'JSON', 'onServerError', err)
                },
            })
            if (this.$pipe[this.$dsn.type] !== undefined) {
                for (const m in this.$pipe[this.$dsn.type]) {
                    if (Object.hasOwnProperty.call(this.$pipe[this.$dsn.type], m)) {
                        this.$rpc.setMethod(m, this.$pipe[this.$dsn.type][m])
                    }
                }
            }
            var that = this
            this.$rpc.listen(parseInt(this.$dsn.port), this.$dsn.host).then(() => {
                console.log('RPC', 'JSON', 'start at', 'http://' + that.$dsn.host + ':' + that.$dsn.port + that.$dsn.path)
            })
        } else {
            console.log('RPC', 'JSON', 'is disabled')
        }
    }

    /**
     * Stop listen
     */
    stop() {
        console.log('RPC', 'JSON', 'stop')
    }

}

/**
 * Class representing a HTTP JSON-RPC server
 * @see https://github.com/sangaman/http-jsonrpc-server
 */
class RpcServer {
    /**
     * @param {Object} options - Optional parameters for the server
     * @param {Object} options.methods - A map of method names to functions. Method functions are
     * passed one parameter which will either be an Object or a string array
     * @param options.context - Context to be used as `this` for method functions.
     * @param {string} options.path - The path for the server
     * @param {function} options.onRequest - Callback for when requests are received, it is
     * passed an Object representing the request
     * @param {function} options.onRequestError - Callback for when requested methods throw errors,
     * it is passed an error and request id
     * @param {function} options.onResult - Callback for when requests are successfully returned a
     * result. It is passed the response object and request id
     * @param {function} options.onServerError - Callback for server errors, it is passed an
     * {@link https://nodejs.org/api/errors.html#errors_class_error Error}
     * @param {string} options.username - Username for authentication. If provided, Basic
     * Authentication will be enabled and required for all requests.
     * @param {string} options.password - Password for authentication, ignored unless a username is
     * also specified.
     * @param {string} options.realm - Realm for authentication, ignored unless a username is also
     * specified, defaults to `Restricted` if not specified.
     */
    constructor(options) {
        this.methods = {}
        this.path = '/'

        if (options) {
            this.applyOptions(options)
        }

        this.server = http.createServer(reqHandler.bind(this))
        if (this.onServerError) {
            this.server.on('error', this.onServerError)
        }
    }

    applyOptions(options) {
        if (options.methods) {
            assert(typeof options.methods === 'object' && !Array.isArray(options.methods), 'methods must be an object')
            const keys = Object.keys(options.methods)
            for (let n = 0; n < keys.length; n += 1) {
                const key = keys[n]
                assert(typeof options.methods[key] === 'function', 'methods may only contain functions')
            }
            this.methods = options.methods
            if (options.context) {
                for (let n = 0; n < keys.length; n += 1) {
                    const key = keys[n]
                    this.methods[key] = this.methods[key].bind(options.context)
                }
            }
        }

        if (options.path) {
            assert(typeof options.path === 'string', 'path must be a string')
            assert(options.path.startsWith('/'), 'path must start with a "/" slash')
            assert(/^[A-Za-z0-9\-./\]@$&()*+,;=`_:~?#!']+$/.test(options.path), 'path contains invalid characters')
            this.path = options.path
        }

        if (options.username) {
            // Basic Authentication is enabled
            assert(typeof options.username === 'string', 'username must be a string')
            let stringToEncode = `${options.username}:`
            if (options.password) {
                assert(typeof options.password === 'string', 'password must be a string')
                stringToEncode += options.password
            }
            this.authorization = Buffer.from(stringToEncode).toString('base64')
            this.realm = options.realm || 'Restricted'
        }

        callbackNames.forEach((callbackName) => {
            if (options[callbackName]) {
                assert(typeof options[callbackName] === 'function', `${callbackName} must be a function`)
                this[callbackName] = options[callbackName]
            }
        })
    }

    static get PARSE_ERROR() {
        return PARSE_ERROR
    }

    static get INVALID_REQUEST() {
        return INVALID_REQUEST
    }

    static get METHOD_NOT_FOUND() {
        return METHOD_NOT_FOUND
    }

    static get INVALID_PARAMS() {
        return INVALID_PARAMS
    }

    static get SERVER_ERROR() {
        return SERVER_ERROR
    }

    static get SERVER_ERROR_MAX() {
        return SERVER_ERROR_MAX
    }

    /**
     * Sets a method.
     * @param {string} name - The name of the method
     * @param {function} method - The function to be called for this method. Method functions are
     * passed one parameter which will either be an Object or a string array.
     */
    setMethod(name, method) {
        assert(typeof method === 'function', 'method is not a function')
        this.methods[name] = method
    }

    /**
     * Begins listening on a given port and host.
     * @param {number} port - The port number to listen on - an arbitrary available port is used if
     * no port is specified
     * @param {string} host - The host name or ip address to listen on - the unspecified IP address
     * (`0.0.0.0` or `(::)`) is used if no host is specified
     * @returns {Promise<number>} A promise that resolves to the assigned port once the server is
     * listening. On error the promise will be rejected with an {@link https://nodejs.org/api/errors.html#errors_class_error Error}.
     */
    listen(port, host) {
        return new Promise((resolve, reject) => {
            const errHandler = (err) => {
                reject(err)
            }

            this.server.listen(port, host, () => {
                resolve(this.server.address().port)
                this.server.removeListener('error', errHandler)
            }).once('error', errHandler)
        })
    }

    /**
     * Stops listening on all ports.
     * @returns {Promise<void>} A promise that resolves once the server stops listening. On error the
     * promise will be rejected with an {@link https://nodejs.org/api/errors.html#errors_class_error Error}.
     */
    close() {
        return new Promise((resolve, reject) => {
            this.server.close(() => {
                resolve()
                this.server.removeAllListeners()
            }).once('error', (err) => {
                reject(err)
            })
        })
    }

    async processRequest(request) {
        if (this.onRequest) {
            this.onRequest(request)
        }
        let response = {
            jsonrpc: '2.0',
        }

        if (request.id) {
            if (request.id !== null && typeof request.id !== 'number' && typeof request.id !== 'string') {
                response.error = {
                    code: INVALID_REQUEST,
                    message: 'Invalid id',
                }
                return response
            }
            response.id = request.id
        }

        if (request.jsonrpc !== '2.0') {
            response.error = {
                code: INVALID_REQUEST,
                message: 'Invalid jsonrpc value',
            }
        } else if (!request.id) {
            // if we have no id, treat this as a notification and return nothing
            response = undefined
        } else if (!request.method || typeof request.method !== 'string' || request.method.startsWith('rpc.') || !(request.method in this.methods)) {
            response.error = {
                code: METHOD_NOT_FOUND,
            }
        } else if (request.params && typeof request.params !== 'object') {
            response.error = {
                code: INVALID_PARAMS,
            }
        } else {
            // we have passed all up front error checks, call the method
            try {
                response.result = await Promise.resolve(this.methods[request.method](request.params))
                if (!response.id) {
                    response = undefined // don't return a response if id is null
                }
            } catch (err) {
                if (this.onRequestError) {
                    this.onRequestError(err, request.id)
                }
                const message = err.message || err
                response.error = { message }
                if (err.code && err.code <= SERVER_ERROR && err.code >= SERVER_ERROR_MAX) {
                    response.error.code = err.code
                } else {
                    response.error.code = SERVER_ERROR
                }
            }
        }

        if (this.onResult && response.result) {
            this.onResult(response.result, request.id)
        }
        return response
    }
}

function sendResponse(res, response) {
    if (response) {
        const responseStr = JSON.stringify(response)
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-Length', Buffer.byteLength(responseStr))
        res.write(responseStr)
    } else {
        // Respond 204 for notifications with no response
        res.setHeader('Content-Length', 0)
        res.statusCode = 204
    }
    res.end()
}

function sendError(res, statusCode, message) {
    res.statusCode = statusCode
    if (message) {
        const formattedMessage = `{"error":"${message}"}`
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-Length', Buffer.byteLength(formattedMessage))
        res.write(formattedMessage)
    }
    res.end()
}

function checkRequest(req, path) {
    let err
    if (req.url !== path) {
        err = { statusCode: 404 }
    } else if (req.method !== 'POST') {
        err = { statusCode: 405 }
    } else if (!req.headers['content-type'] || (req.headers['content-type'] !== 'application/json' &&
            !req.headers['content-type'].startsWith('application/json;'))) {
        err = { statusCode: 415 }
    } else if (!req.headers.accept || (req.headers.accept !== 'application/json' &&
            !req.headers.accept.split(',').some((value) => {
                const trimmedValue = value.trim()
                return trimmedValue === 'application/json' || trimmedValue.startsWith('application/json;')
            }))) {
        err = { statusCode: 400, message: INVALID_ACCEPT_HEADER_MSG }
    } else {
        const reqContentLength = parseInt(req.headers['content-length'], 10)
        if (Number.isNaN(reqContentLength) || reqContentLength < 0) {
            err = { statusCode: 400, message: INVALID_CONTENT_LENGTH_MSG }
        }
    }
    return err
}

function reqHandler(req, res) {
    res.setHeader('Connection', 'close')
    const reqErr = checkRequest(req, this.path)
    if (reqErr) {
        sendError(res, reqErr.statusCode, reqErr.message)
        return
    }

    if (this.authorization) {
        const { authorization } = req.headers
        if (!authorization || !authorization.startsWith('Basic ') || authorization.substring(6) !== this.authorization) {
            res.setHeader('WWW-Authenticate', `Basic realm="${this.realm}"`)
            sendError(res, 401)
            return
        }
    }

    const body = []
    req.on('data', (chunk) => {
        body.push(chunk)
    }).on('end', () => {
        const bodyStr = Buffer.concat(body).toString()
        const reqContentLength = parseInt(req.headers['content-length'], 10)

        if (Buffer.byteLength(bodyStr) !== reqContentLength) {
            sendError(res, 400, INVALID_CONTENT_LENGTH_MSG)
            return
        }

        res.setHeader('Content-Type', 'application/json')

        let request
        try {
            request = JSON.parse(bodyStr)
        } catch (err) {
            const response = {
                id: null,
                jsonrpc: '2.0',
                error: {
                    code: PARSE_ERROR,
                    message: err.message,
                },
            }
            sendResponse(res, response)
            return
        }

        if (Array.isArray(request)) {
            if (request.length === 0) {
                sendResponse(res)
            } else {
                const requestPromises = []
                for (let n = 0; n < request.length; n += 1) {
                    requestPromises.push(this.processRequest(request[n]))
                }
                Promise.all(requestPromises).then((responses) => {
                    // Remove undefined values from responses array.
                    // These represent notifications that don't require responses.
                    let prunedResponses = []
                    for (let n = 0; n < responses.length; n += 1) {
                        if (responses[n]) {
                            prunedResponses.push(responses[n])
                        }
                    }
                    if (prunedResponses.length === 0) {
                        // If all the requests were notifications, there should be no response
                        prunedResponses = undefined
                    }
                    sendResponse(res, prunedResponses)
                })
            }
        } else {
            this.processRequest(request).then((response) => {
                sendResponse(res, response)
            })
        }
    })
}

module.exports = RPC_JSON