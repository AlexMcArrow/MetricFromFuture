# Metric From Future

[![CodeQL](https://github.com/AlexMcArrow/MetricFromFuture/actions/workflows/codeql-analysis.yml/badge.svg?branch=master)](https://github.com/AlexMcArrow/MetricFromFuture/actions/workflows/codeql-analysis.yml)

`v0.2.18`

Metric Server for calculation timing of script execution time

* When script is run, metric use script execution time
* When script is end with unix-code=0, metric use STDOUT as integer of script measuring
* When script is end with unix-code>0, metric use 1000 second execution time - as error signal

---

## Lifecycle

The Collector for each Metric starts the Runner with the specified frequency.

The launch of a new Runner is not limited to the already / still working Runners of this Metric.

Each Runner starts with time = `-1` to handle fast execution correctly. Then its execution time will tend to a value equal to `0` .

Runner's working hours are not limited.

The collector with a frequency of `1` (one) second removes the current running time of the Runner (s). The highest value is more significant. This value is considered a `LIVE` -value.

When the Runner finishes working, he outputs to `STDOUT` the value that determines the time that the script has measured and considers it necessary to consider `SAVE` -value.

The `SAVE` -value is considered correct as long as it is less than any `LIVE` -value of the Runners of this Metric.

---

## Used ENVs

| ENV | description |
| ------------ | ----------- |
| `NODE_ENV` | If not `production` redefine `PATH_LOG` & `PATH_CONFIG` to local logs-folder & local config.json |
| `PATH_LOG` | Path (folder) to logs folder |
| `PATH_CONFIG` | Path (file) to config.json |

## Example of `config.json` (see: config.json._)

```json
{
    "server": {
        "port": 20744,
        "logs": false
    },
    "metric": {
        "check": {
            "interval": 15,
            "run": "/usr/bin/sh /home/user/check.sh",
            "notice": 20,
            "warning": 35,
            "error": 45,
            "history": 10,
            "call": "/usr/bin/sh /home/user/send.sh --metric=$1 --level=$2 --time=$3"
        },
    }
}
```

## `config.json` structure

| JSON-section | type | description |
| ------------ | ---- | ----------- |
| `server.port` | integer | MFF HTTP-RPC port |
| `server.logs` | boolean | MFF can generate log-files |
| `metric.[name]` | string | Metric section |
| `metric.[name].interval` | integer | Metric execution interval |
| `metric.[name].run` | string | Metric execution script |
| `metric.[name].notice` | integer | Metric NOTICE timing |
| `metric.[name].warning` | integer | Metric WARNING timing |
| `metric.[name].error` | integer | Metric ERROR timing |
| `metric.[name].history` | integer | Metric history storage size |
| `metric.[name].call` | RegExp-string | Metric history execution script on (notice, warning, error) <br> Can use RegExp params: <br> $1 - Metric name `[check]` <br> $2 - Logging level `[notice\|warning\|error]` <br> $3 - Metric timing `[10]` |

## Logs

Each metric creates a file of the same name in the logs folder
This log file contains records of not `OK` work ( `notice` , `warning` , `error` )

```log
1634225398829|2021-10-14T15:29:58.829Z|alpha|notice|10
1634225398829|2021-10-14T15:29:58.829Z|alpha|warning|20
1634225398829|2021-10-14T15:29:58.829Z|alpha|error|1000
```

## Log file structure (example by first row)

| section | type | description |
| ------------ | ---- | ----------- |
| `1634225398829` | integer | Unixtimestamp of record create |
| `2021-10-14T15:29:58.829Z` | datetimez | UTC formated date-time |
| `alpha` | string | Metric name |
| `notice` | string | Logging level |
| `10` | integer | Metric timing |

## HTTP-RPC

| URI-path | vars | description |
| ------------ | ---- | ----------- |
| `/` | --- | root of rpc |
| `/?get=*` | --- | get all metrics data |
| `/?get=all` | --- | get all metrics data |
| `/?get=[name]` | `name` - metric name | get specific metric data  |
| `/?get=_sys` | --- | Metric name |

## Example of output for URI-path = `/`

```json
{
    "c": 1,
    "d": { }
}
```

| JSON-section | type | description |
| ------------ | ---- | ----------- |
| `c` | integer | Result code |
| `d` | string | Data section |

## Example of output for URI-path = `/?get=*` or `/?get=all`

```json
{
    "c": 1,
    "d": {
        "alpha": {
            "v": 5,
            "t": 1634412899058,
            "dt": "2021-10-16T19:34:59.058Z",
            "hist": {
                "1634710497731": {
                    "v": 40,
                    "t": 1634710497731,
                    "dt": "2021-10-20T06:14:57.731Z"
                },
            }
        }
    }
}
```

| JSON-section | type | description |
| ------------ | ---- | ----------- |
| `c` | integer | Result code |
| `d` | string | Data section |
| `d.[name]` | object | Metric section |
| `d.[name].v` | int | Actual timing for metric |
| `d.[name].t` | int | Unixtimestamp (with milliseconds) for actual timing |
| `d.[name].dt` | int | Datetime for actual timing |
| `d.[name].hist` | object | History block |
| `d.[name].hist.[histblock]` | string | Unixtimestamp (with milliseconds) of history block |
| `d.[name].hist.[histblock].v` | int | History timing |
| `d.[name].hist.[histblock].t` | int | History Unixtimestamp (with milliseconds) |
| `d.[name].hist.[histblock].dt` | string | History Datetime |

## Example of output for URI-path = `/?get=[name]`

```json
{
    "c": 1,
    "d": {
        "v": 5,
        "t": 1634413031384,
        "dt": "2021-10-16T19:37:11.384Z",
        "hist": {
            "1634710497731": {
                "v": 40,
                "t": 1634710497731,
                "dt": "2021-10-20T06:14:57.731Z"
            },
        }
    }
}
```

| JSON-section | type | description |
| ------------ | ---- | ----------- |
| `c` | integer | Result code |
| `d` | string | Data section |
| `d.v` | int | Actual timing for metric |
| `d.t` | int | Unixtimestamp for actual timing |
| `d.dt` | int | Datetime for actual timing |
| `d.hist` | object | History block |
| `d.hist.[histblock]` | string | Unixtimestamp (with milliseconds) of history block |
| `d.hist.[histblock].v` | int | History timing |
| `d.hist.[histblock].t` | int | History Unixtimestamp (with milliseconds) |
| `d.hist.[histblock].dt` | string | History Datetime |

## Example of output for URI-path = `/?get=_sys`

```json
{
    "c": 1,
    "d": {
        "alpha": {
            "v": 5,
            "t": 1634413183725,
            "dt": "2021-10-16T19:39:43.725Z",
            "hist": {
                "1634710497731": {
                    "v": 40,
                    "t": 1634710497731,
                    "dt": "2021-10-20T06:14:57.731Z"
                },
            },
            "r": {
                "6ad5e63d9b3f2dd54442c19bc64908a5": -1
            }
        }
    }
}
```

| JSON-section | type | description |
| ------------ | ---- | ----------- |
| `c` | integer | Result code |
| `d` | string | Data section |
| `d.[name]` | object | Metric section |
| `d.[name].v` | int | Actual timing for metric |
| `d.[name].t` | int | Unixtimestamp for actual timing |
| `d.[name].dt` | int | Datetime for actual timing |
| `d.[name].hist` | object | History block |
| `d.[name].hist.[histblock]` | string | Unixtimestamp (with milliseconds) of history block |
| `d.[name].hist.[histblock].v` | int | History timing |
| `d.[name].hist.[histblock].t` | int | History Unixtimestamp (with milliseconds) |
| `d.[name].hist.[histblock].dt` | string | History Datetime |
| `d.[name].r` | object | List of exucuted Runners for this metric |
| `d.[name].r[id]` | string | ID of exucuted Runner |
| `d.[name].r[id]=[value]` | int | Time of Runner execution |

## License

The MIT License (MIT).

Please see [ `LICENSE` ](./LICENSE) for more information.

Maintained by [Alex McArrow](https://github.com/AlexMcArrow)
