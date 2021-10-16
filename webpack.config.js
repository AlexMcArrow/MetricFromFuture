const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    target: 'node',
    mode: 'production',
    entry: './server.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'mff.js'
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    output: {
                        comments: false,
                    },
                },
            })
        ],
    },
};