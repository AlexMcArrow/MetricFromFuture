const child_process = require('child_process')

class CALLER_SHELL {

    /**
     * Constructor
     * @param {path} shell path with regexp
     */
    constructor(path) {
        this.$path = path
    }

    /**
     * Run shell
     * @param {string} metric
     * @param {string} level
     * @param {float} value
     */
    ring(metric, level, value) {
        var line = this.$path
        line = line.replace(/\$1/g, metric)
        line = line.replace(/\$2/g, level)
        line = line.replace(/\$3/g, value)
        child_process.exec(line)
    }

}

module.exports = CALLER_SHELL