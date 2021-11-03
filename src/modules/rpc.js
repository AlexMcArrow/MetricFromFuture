const rpc_drivers = require('./rpc/_all')

class RPC {

    /**
     * Constructor
     * @param {string} rpc driver
     */
    constructor(driver, driverconf, server) {
        if (driver in rpc_drivers) {
            var drv = new rpc_drivers[driver](driverconf, server)
            if (drv !== undefined) {
                this.$driver = drv
                return true
            }
        }
        return false
    }

    /**
     * Start rpc listener
     */
    start() {
        this.$driver.start()
    }

    /**
     * Stop rpc listener
     */
    stop() {
        this.$driver.stop()
    }

}

module.exports = RPC