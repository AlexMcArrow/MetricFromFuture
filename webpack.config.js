const glob = require('glob');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');

module.exports = {
    target: 'node',
    mode: 'production',
    entry: {
        mff: './index.js',
        cli: './cli/index.js'
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    plugins: [
        new CopyPlugin({
            patterns: [{
                from: path.resolve(__dirname, 'config.json._'),
                to: path.resolve(__dirname, 'dist', 'config.json'),
            }, {
                from: path.resolve(__dirname, 'pm2_server.json._'),
                to: path.resolve(__dirname, 'dist', 'pm2_server.json'),
            }, {
                from: path.resolve(__dirname, 'LICENSE'),
                to: path.resolve(__dirname, 'dist'),
            }],
        }),
        new ZipPlugin({
            path: '../zip',
            filename: 'mff.zip',
            fileOptions: {
                mtime: new Date(),
                mode: 0o100664,
                compress: true,
                forceZip64Format: false,
            },
        })
    ],
    optimization: {
        minimizer: [
            new TerserPlugin({
                minify: TerserPlugin.uglifyJsMinify,
                terserOptions: {
                    output: {
                        comments: false,
                    },
                },
                extractComments: false,
            })
        ],
    },
};