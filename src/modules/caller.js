const caller_drivers = require('./caller/_all')

class CALLER {

    /**
     * Constructor
     * @param {string} caller driver
     */
    constructor(driver, driverconf) {
        if (driver in caller_drivers) {
            this.$driver = new caller_drivers[driver](driverconf)
            return true
        }
        return false
    }

    /**
     * Ring caller
     * @param {string} metric
     * @param {string} level
     * @param {float} value
     */
    ring(metric, level, value) {
        this.$driver.ring(metric, level, value)
    }

}

module.exports = CALLER