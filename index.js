/**
 * Metric From Future
 * Metric Server for calculation timing of script execution time
 *
 * @author AlexMcArrow <alex.mcarrow@gmail.com>
 * @version 0.3.0
 * @package metricfromfuture
 */

const server = require('./src/server')

var MFF = new server()
MFF.start(process.env.PATH_CONFIG || './config.json')

/** End of index */