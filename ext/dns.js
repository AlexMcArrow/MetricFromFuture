/**
 * DNS Lookup speed tester
 *
 * use: node dns.js domain.tld A 8.8.8.8
 * where:
 *  - domain.tld - checked DNS-record
 *  - A - type of DNS-record
 *  - 8.8.8.8 - used DNS-server
 */

var dns = require('dns');
const { hrtime } = require('process');

const NS_PER_SEC = 1e9;
const NS_TO_MS = 1e6;

/**
 * DNS lookup speed check
 * @param {string} host Checked DNS-record
 * @param {string} rrtype [A,AAAA,ANY,CAA,CNAME,MX,NAPTR,NS,PTR,SOA,SRV,TXT] see: https://nodejs.org/api/dns.html#dnsresolvehostname-rrtype-callback
 * @param {string} dnshost Used DNS-server
 * @param {function} cb (string err, int time) Callback function
 */
function DNSLookupSpeed(host, rrtype, dnshost, cb) {
    dns.setServers([dnshost]);
    var start = hrtime();
    dns.resolve(host, rrtype, function(err) {
        var diff = hrtime(start);
        cb(err != null ? err.code : 'OK', Math.round((diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS));
    });
}

const run = process.argv.slice(2);

DNSLookupSpeed(run[0], run[1], run[2], (err, end) => {
    if (err == 'OK') {
        console.log(end);
    } else {
        console.log(1000);
    }
});