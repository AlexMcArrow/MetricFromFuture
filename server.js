/**
 * Metric From Future
 * Metric Server for calculation timing of script execution time
 *
 * @author AlexMcArrow <alex.mcarrow@gmail.com>
 * @version 0.2.18
 * @package metricfromfuture
 */

const fs = require('fs');
const http = require('http');
const url = require('url');
const path = require('path');
const child_process = require('child_process');
const crypto = require('crypto');

/**
 * Helper class with frequently used functions
 */
class Helper {

    /**
     * Generate random ID
     * @returns string
     */
    id() {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * Return current Unix timestamp
     * @returns string
     */
    ts() {
        return Date.now();
    }

    /**
     * Return current date-time
     * @returns datetime
     */
    dt() {
        return new Date().toISOString();
    }
}

/**
 * Collector for store actual (by logic) value
 */
class Collector {

    /**
     * Constructor
     * @param {int} history History max count
     */
    constructor(history = 10) {
        var that = this;
        that.Helper = new Helper;
        that._s = 0;
        that._l = 0;
        that._t = that.Helper.ts();
        that._dt = that.Helper.dt();
        that._history = {};
        that._max_history = parseInt(history);
    }

    /**
     * Save complete value
     * @param {int} v complete Value
     */
    save(v) {
        var that = this;
        that._history[that._t] = {
            v: that._s,
            t: that._t,
            dt: that._dt
        };
        that._s = v;
        that._l = that._s;
        that._t = that.Helper.ts();
        that._dt = that.Helper.dt();
        if (Object.keys(that._history).length > that._max_history) {
            delete that._history[Object.keys(that._history)[0]];
        }
    }

    /**
     * Store current value
     * @param {int} v current value
     */
    live(v) {
        var that = this;
        if (v > that._s) {
            that._l = parseInt(v);
            that._t = that.Helper.ts();
            that._dt = that.Helper.dt();
        } else {
            if (v > that._l) {
                that._l = parseInt(v);
                that._t = that.Helper.ts();
                that._dt = that.Helper.dt();
            }
        }
    }

    /**
     * Return actual value, timestame, datetime
     * @returns object
     */
    now() {
        var that = this;
        return { v: that._l, t: that._t, dt: that._dt, hist: that._history };
    }
}

/**
 * Collector pool
 */
class CollectorPool {

    /**
     * Constructor
     */
    constructor() {
        var that = this;
        that.Helper = new Helper;
        that._pool = {};
    }

    /**
     * Create new Metric with params
     * @param {bool} uselogs Using file-logs flag
     * @param {string} metric Metric name
     * @param {int} period Period of metric run in millisecond
     * @param {object} runner Runner
     * @param {int} notice Time of Notice range
     * @param {int} warn Time of Warning range
     * @param {int} error Time of Error range
     * @param {int} history History max count
     * @param {bool|string} call Call string
     * @returns
     */
    create(uselogs, metric, period, runner, notice = 10, warn = 30, error = 1000, history = 10, call = false) {
        var that = this;
        metric = that._metric(metric);
        period = parseInt(period);
        that._pool[metric] = {
            id: metric,
            p: period,
            r: runner,
            _tn: notice,
            _tw: warn,
            _te: error,
            _c: new Collector(history),
            _r: {},
            _t: null,
            _log: new Logs(uselogs, path_logs, metric),
            _call: new Caller(call, metric)
        };
        return true;
    }

    /**
     * Run all metrics in pool
     * @returns bool
     */
    startALL() {
        var that = this;
        for (const k in that._pool) {
            if (that._pool.hasOwnProperty(k)) {
                const e = that._pool[k];
                that._initRunner(e);
                e._t = setInterval(() => {
                    that._initRunner(e);
                }, e.p);
            }
        }
        return true;
    }

    /**
     * Stop all metrics in pool
     * @returns bool
     */
    stopALL() {
        var that = this;
        for (const k in that._pool) {
            if (that._pool.hasOwnProperty(k)) {
                const e = that._pool[k];
                clearInterval(e._t);
            }
        }
        return true;
    }

    /**
     * Initilize runner for metric by config
     * @param {object} e Metric config
     */
    _initRunner(e) {
        var that = this;
        var t = that.Helper.id();
        e._r[t] = new Runner(t, e.r, (tid, r) => {
            e._c.save(r);
            delete e._r[tid];
            if (r >= e._te) {
                that._log(e.id, 'error', r);
            } else if (r >= e._tw) {
                that._log(e.id, 'warning', r);
            } else if (r >= e._tn) {
                that._log(e.id, 'notice', r);
            }
        }, (l) => {
            e._c.live(l);
        });
    }

    /**
     * Get Metric actual value
     * @param {string} metric Metric name
     * @returns object
     */
    get(metric) {
        var that = this;
        metric = that._metric(metric);
        if (that._pool.hasOwnProperty(metric)) {
            return that._pool[metric]._c.now();
        }
        return {};
    }

    /**
     * Get all Metrics actual values
     * @returns object
     */
    getALL() {
        var that = this;
        var out = {};
        for (const k in that._pool) {
            if (that._pool.hasOwnProperty(k)) {
                const e = that._pool[k];
                out[e.id] = e._c.now();
            }
        }
        return out;
    }

    /**
     * Get all Metrics actual values & runner lists
     * @returns object
     */
    getSYS() {
        var that = this;
        var out = {};
        for (const k in that._pool) {
            if (that._pool.hasOwnProperty(k)) {
                const e = that._pool[k];
                const r = Object.keys(e._r);
                const rl = {};
                for (const x in r) {
                    rl[r[x]] = e._r[r[x]].tc;
                }
                out[e.id] = {
                    ...e._c.now(),
                    r: rl
                };
            }
        }
        return out;
    }

    /**
     * Return clear metric name
     * @param {string} metric Metric name
     * @returns string
     */
    _metric(metric) {
        return metric.trim().toLowerCase();
    }

    /**
     * Logging and Calling
     * @param {string} metric Metric name
     * @param {string} level Log level
     * @param {mixed} val logging value
     */
    _log(metric, level, val) {
        var that = this;
        that._pool[metric]._log.write(that.Helper.ts() + '|' + that.Helper.dt() + '|' + metric + '|' + level + '|' + val + '\n');
        that._pool[metric]._call.ring(level, val);
    }
}

/**
 * External script runner class
 */
class Runner {

    /**
     *
     * @param {string} id Runner ID
     * @param {string} runner Runnable script
     * @param {func} cbret Callback function for return value
     * @param {func} cblive Callback function for publish "live" value
     */
    constructor(id, runner, cbret, cblive) {
        var that = this;
        that._id = id;
        that._runner = runner;
        that._cbret = cbret;
        that._cblive = cblive;
        that.work();
        that.tc = -1;
        that.t = setInterval(() => {
            that.tc++;
            that._cblive(that.tc);
        }, 1000);
    }

    /**
     * Worker function
     */
    work() {
        var that = this;
        var workerProcess = child_process.exec(that._runner);
        workerProcess.stdout.on('data', function(data) {
            clearInterval(that.t);
            that._cbret(that._id, parseInt(data.toString()));
        });
        workerProcess.stderr.on('data', function(data) {
            clearInterval(that.t);
            console.error('Error in worker: ', data);
            that._cbret(that._id, 1000);
        });
        workerProcess.on('close', function(code) {
            clearInterval(that.t);
            workerProcess = null;
            if (code > 0) {
                that._cbret(that._id, 1000);
            }
        });
        workerProcess.on('exit', function(code) {
            clearInterval(that.t);
            workerProcess = null;
            if (code > 0) {
                that._cbret(that._id, 1000);
            }
        });
    }
}

/**
 * Logger
 */
class Logs {

    /**
     * Constructor
     * @param {bool} use Using log write
     * @param {string} path Path for log-file
     * @param {string} metric Metric name
     */
    constructor(use, path, metric) {
        var that = this;
        that._use = use;
        that._path = path;
        that._metric = metric;
        that._log = null;
        if (that._use && !fs.existsSync(path.join(path_logs))) {
            fs.mkdirSync(path.join(path_logs));
        }
    }

    /**
     * Write into log
     * @param {string} line
     */
    write(line) {
        var that = this;
        if (that._use) {
            if (that._log.write !== 'function') {
                that._log = fs.createWriteStream(path.join(that._path, that._metric + '.log'), { flags: 'a' });
            }
            that._log.write(line);
        }
    }
}

/**
 * Caller
 */
class Caller {

    /**
     * Constructor
     * @param {bool|string} call Script for calling
     * @param {string} metric Metric name
     */
    constructor(call, metric) {
        var that = this;
        that._call = call;
        that._metric = metric;
        that._caller = null;
    }

    /**
     * Ringing script for calling
     * @param {string} level Log level
     * @param {mixed} val logging value
     */
    ring(level, val) {
        var that = this;
        if (that._call !== false) {
            var line = that._call;
            line = line.replace(/\$1/g, that._metric);
            line = line.replace(/\$2/g, level);
            line = line.replace(/\$3/g, val);
            child_process.exec(line);
        }
    }
}

/**
 * Metric From Future main class
 */
class MFF {

    /**
     * Constructor
     */
    constructor() {
        var that = this;
        console.log('MFF init');
        that.http = null;

        that.config = {
            server: {
                port: 20744,
                logs: true
            },
            metric: {}
        };
        /// catch errors
        process.on('uncaughtException', function(err) {
            console.error('Caught exception: ', err);
        });
        /// init pool
        that.pool = new CollectorPool();
        /// check config
        if (fs.existsSync(path_config)) {
            try {
                /// load config
                that.config = JSON.parse(fs.readFileSync(path_config));
                /// create listeners
                for (const m in that.config.metric) {
                    if (that.config.metric.hasOwnProperty(m)) {
                        const mdata = that.config.metric[m];
                        that.pool.create(that.config.server.logs, m, mdata.interval, mdata.run, mdata.notice, mdata.warning, mdata.error, mdata.history, mdata.call);
                    }
                }
            } catch (error) {
                throw new Error(error.toString());
            }
        }
        /// run RPC
        that.bootstrap();
        /// start listeners
        that.pool.startALL();
        /// catch SIGs
        process.on('SIGTERM', () => {
            console.info('CATCH SIGTERM');
            that.shutdown();
        });
        process.on('SIGINT', () => {
            console.info('CATCH SIGINT');
            that.shutdown();
        });
    }

    /**
     * Boostrap function
     */
    bootstrap() {
        var that = this;
        const requestListener = function(req, res) {
            var parts = url.parse(req.url, true);
            var query = parts.query;
            var r = {
                c: 1,
                d: {}
            };
            if (query.get !== undefined) {
                switch (query.get) {
                    case 'all':
                    case '*':
                        r.d = that.pool.getALL();
                        break;
                    case '_sys':
                        r.d = that.pool.getSYS();
                        break;
                    default:
                        r.d = that.pool.get(query.get);
                        break;
                }
            }
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(r));
        }
        that.http = http.createServer(requestListener);
        that.http.listen(parseInt(that.config.server.port), () => {
            console.log('MFF run at :' + that.config.server.port);
        });
    }

    /**
     * Shutdown function
     */
    shutdown() {
        var that = this;
        console.log('MFF stoping');
        that.pool.stopALL();
        that.http.close(() => {
            console.log('MFF shutdown');
            process.exit(0);
        });
    }
}

// Check ENV
if (process.env.NODE_ENV !== 'production') {
    process.env.PATH_LOG = 'logs';
    process.env.PATH_CONFIG = 'config.json';
}

// read path_logs & path_config from ENV
const path_logs = process.env.PATH_LOG;
const path_config = process.env.PATH_CONFIG;

// Check path_logs & path_config => run MFF
if (path_logs !== undefined && path_config !== undefined) {
    new MFF;
} else {
    // ENV not set => exit(1)
    console.error('ENV not set', 'PATH_CONFIG=', process.env.PATH_CONFIG, 'PATH_LOG=', process.env.PATH_LOG);
    process.exit(1);
}