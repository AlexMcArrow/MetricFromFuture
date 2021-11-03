/**
 * Metric From Future
 * Metric Server for calculation timing of script execution time
 *
 * @author AlexMcArrow <alex.mcarrow@gmail.com>
 * @version 0.3.0
 * @package metricfromfuture
 */

const fs = require('fs')

const modules = require('./modules/_all')

class MFF {

    /**
     * Constructor
     */
    constructor(config_path = './config.json') {
        console.log('MFF', 'init defs')

        this.$config = {
            rpc: {},
            metric: {},
            caller: {},
            logger: {}
        }

        this.$rpc = {}
        this.$metric = {}
        this.$caller = {}
        this.$logger = {}

        console.log('MFF', 'read config from', config_path)
        this.$readConfig(config_path)

        console.log('MFF', 'init:')
        this.$initLogger()
        this.$initRPC()
        this.$initCaller()
        this.$initMetric()
        console.log('MFF', 'init complete')
    }

    $readConfig(path) {
        if (fs.existsSync(path)) {
            try {
                this.$config = JSON.parse(fs.readFileSync(path))
            } catch (error) {
                throw new Error(error.toString())
            }
        }
    }

    $initRPC() {
        console.log('MFF', 'init', 'RPCs')
        for (const rpcidx in this.$config.rpc) {
            if (Object.hasOwnProperty.call(this.$config.rpc, rpcidx)) {
                const element = this.$config.rpc[rpcidx]
                var drv = new modules.rpc(element.driver, element, this.$$pipe(this))
                if (drv.$driver !== undefined) {
                    this.$rpc[rpcidx] = drv
                }
            }
        }
        console.log('MFF', 'init', 'RPCs', Object.keys(this.$rpc))
    }

    $initMetric() {
        console.log('MFF', 'init', 'Metrics')
            //TODO: Metric init loop
    }

    $initCaller() {
        console.log('MFF', 'init', 'Callers')
            //TODO: Caller init loop
    }

    $initLogger() {
        console.log('MFF', 'init', 'Loggers')
            //TODO: Logger init loop
    }

    start() {
        console.log('MFF', 'start')

        this.$startLogger()
        this.$startRPC()
        this.$startCaller()
        this.$startMetric()
    }

    $startRPC() {
        console.log('MFF', 'start', 'RPCs')
        for (const rpcidx in this.$rpc) {
            if (Object.hasOwnProperty.call(this.$rpc, rpcidx)) {
                const rpc = this.$rpc[rpcidx]
                rpc.start()
            }
        }
    }

    $startMetric() {
        console.log('MFF', 'start', 'Metrics')
            //TODO: Metric start loop
    }
    $startCaller() {
        console.log('MFF', 'start', 'Callers')
            //TODO: Caller start loop
    }
    $startLogger() {
        console.log('MFF', 'start', 'Loggers')
            //TODO: Logger start loop
    }

    stop() {
        console.log('MFF', 'stop')

        this.$stopMetric()
        this.$stopCaller()
        this.$stopRPC()
        this.$stopLogger()
        process.exit(0)
    }

    $stopRPC() {
        console.log('MFF', 'stop', 'RPCs')
        for (const rpcidx in this.$rpc) {
            if (Object.hasOwnProperty.call(this.$rpc, rpcidx)) {
                const rpc = this.$rpc[rpcidx]
                rpc.stop()
            }
        }
    }

    $stopMetric() {
        console.log('MFF', 'stop', 'Metrics')
    }
    $stopCaller() {
        console.log('MFF', 'stop', 'Callers')
    }
    $stopLogger() {
        console.log('MFF', 'stop', 'Loggers')
    }

    /**
     * Proxy-pipe controled functions
     * @param {this} that
     * @returns functions
     */
    $$pipe(that) {
        return {
            /**
             * Used by internal
             */
            ///TODO: Work with internal config
            config: {
                read(a) {
                    return that.$config.rpc
                        ///TODO: dummy
                },
                write(a) {
                    return that.$config.rpc
                        ///TODO: dummy
                },
                save() {
                    return 'saved'
                        ///TODO: dummy
                }
            },
            /**
             * Used by RPC
             */
            ///TODO: work with front-data (metric)
            front: {
                ping() {
                    return 'pong'
                },
                list() {
                    ///TODO: work with Metric(read list)
                    return []
                },
                get(params) {
                    if (params.item !== undefined) {
                        ///TODO: work with Metric(read by name)
                        return {
                            item: params.item
                        }
                    }
                    return false
                }
            },
            /**
             * Used by RPC
             */
            ///TODO: work with back-methods like: stoping server, etc
            back: {
                ping() {
                    return 'pong'
                },
                stop() {
                    /** Stop after 250ms for return responce */
                    setTimeout(() => {
                        that.stop()
                    }, 250)
                    return true
                }
            }
        }
    }
}

module.exports = MFF