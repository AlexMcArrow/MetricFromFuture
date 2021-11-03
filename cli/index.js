/**
 * MFF HTTP-JSON-RPC CLI-client for administrative operation
 */

const { match } = require('assert');
var http = require('http')

var JSONRPCClient = function(port, host, path = null) {
    this.port = port;
    this.host = host;
    this.path = path;

    this.call = function(method, params, callback) {
        var requestJSON = JSON.stringify({
            'jsonrpc': '2.0',
            'id': (new Date().getTime()),
            'method': method,
            'params': params,
            'cl': 'mffcli'
        });
        var headers = {
            'host': host,
            'Content-Length': requestJSON.length,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (this.path === null) {
            this.path = '/';
        }

        var options = {
            host: host,
            port: port,
            path: this.path,
            headers: headers,
            method: 'POST'
        }

        var buffer = '';

        var req = http.request(options, function(res) {
            res.on('data', function(chunk) {
                buffer = buffer + chunk;
            });

            res.on('end', function() {
                var decoded = {}
                try {
                    decoded = JSON.parse(buffer);
                } catch (error) {
                    callback(error, null);
                    return
                }

                if (decoded.hasOwnProperty('result')) {
                    callback(null, decoded.result);
                } else {
                    callback(decoded.error, null);
                }
            });

            res.on('error', function(err) {
                callback(err, null);
            });
        });

        req.on('error', function(err) {
            console.error('ClientError:', err.code);
        });

        req.write(requestJSON);
        req.end();
    };
}

const ARGUMENT_SEPARATION_REGEX = /([^=\s]+)=?\s*(.*)/;

function Parse(argv) {
    // Removing node/bin and called script name
    argv = argv.slice(2);

    const parsedArgs = {};
    let argName, argValue;

    argv.forEach(function(arg) {
        // Separate argument for a key/value return
        arg = arg.match(ARGUMENT_SEPARATION_REGEX);
        arg.splice(0, 1);

        // Retrieve the argument name
        argName = arg[0];

        // Remove "--" or "-"
        if (argName.indexOf('-') === 0) {
            argName = argName.slice(argName.slice(0, 2).lastIndexOf('-') + 1);
        }

        // Parse argument value or set it to `true` if empty
        argValue =
            arg[1] !== '' ?
            parseFloat(arg[1]).toString() === arg[1] ?
            +arg[1] :
            arg[1] :
            true;

        parsedArgs[argName] = argValue;
    });

    return parsedArgs;
}

/** Read args from cmd */
var args = Parse(process.argv);
/** Set from args or use defs */
var host = args.host || '127.0.0.1'
var port = args.port || 20799
var path = args.path || '/'
var method = args.method || 'ping'
var params = {}

for (const key in args) {
    if (Object.hasOwnProperty.call(args, key)) {
        const value = args[key];
        switch (key) {
            case 'host':
            case 'port':
            case 'path':
            case 'method':
                break;

            default:
                if (value === true) {
                    method = key
                } else if (key.match(/^p\.(.*)$/)) {
                    params[key.replace(/^p\./, '')] = value
                }
                break;
        }
    }
}

if (Object.keys(args).length == 0) {
    console.log('')
    console.log('  MFF HTTP-JSON-RPC CLI-client')
    console.log('')
    console.log('use: node cli.js method [args,...]')
    console.log('     node cli.js ping --port=20799')
    console.log('     node cli.js ping --p.alpha=5 --p.beta=7    => params: {"alpha":5,"beta":7}')
    console.log('')
    console.log('\targ\t\treq\tdescription \tdefault')
    console.log('')
    console.log('\t--host\t\t\tserver host \t"127.0.0.1"')
    console.log('\t--port\t\t\tserver port \t20799 (back-RPC)')
    console.log('\t--path\t\t\tserver path \t"/"')
    console.log('\t--p.[key]\t\tset params key \t"{}"')
    console.log('\t--method\t*\texecuted method')
    console.log('')
    return
}

/** Run client */
var client = new JSONRPCClient(port, host, path)
client.call(method, params, function(error, result) {
    if (error) {
        console.error('ServerError:', error);
    }
    console.log('ServerResult:', result);
});
/** End of CLI */