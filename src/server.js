/**
 * Metric From Future
 * Metric Server for calculation timing of script execution time
 *
 * @author AlexMcArrow <alex.mcarrow@gmail.com>
 * @version 0.3.0
 * @package metricfromfuture
 */

const modules = require('./modules/_all')
const exts = require('./ext/_all')

class MFF {

    /**
     * Constructor
     */
    constructor() {

        console.log('MFF init')
            // var hget = new modules.caller('httpget', 'http://127.0.0.1:8080/api/v2/ping')
            // hget.ring('test', 'log', 0)
    }

    start() {
        console.log('MFF start')
        this.stop()
    }

    stop() {
        console.log('MFF stop')
    }
}

module.exports = MFF
