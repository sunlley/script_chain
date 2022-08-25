const path = require('path');

const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const webpack = require('webpack')
module.exports = {
    mode: 'development',
    devtool: "source-map",
    entry: {
        core: './signer/main.js',
        // inject: './inject/main.js',
    },
    output: {
        filename: '[name].js',
        // path: path.resolve(__dirname, 'out'),
        path: "/Users/kayo/Projects/befi_sdk/befi_core/src/main/assets/files",
    },
    optimization: {
        // splitChunks: {
        //     chunks: 'all',
        // },
        minimize: true,
        minimizer:[
           new UglifyJsPlugin({
               uglifyOptions:{
                   output: {},
                   // compress: {
                   //     drop_console:true
                   // }
               }
           })
        ]
    },
    module: {
        rules: [
            //将所有目录下的es6代码转译为es5代码，但不包含node_modules目录下的文件
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use:{
                    loader:'babel-loader',
                    // options:{
                    //     preset:['es2015']
                    // }
                }
            },
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ["buffer", "Buffer"]
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
        new webpack.ProvidePlugin({
            crypto: 'crypto-browserify',
        }),
        new webpack.ProvidePlugin({
            stream: 'stream-browserify',
        }),
        new webpack.ProvidePlugin({
            https: 'https-browserify',
        }),
        new webpack.ProvidePlugin({
            http: 'stream-http',
        }),
        new webpack.ProvidePlugin({
            https: 'https-browserify',
        }),
        new webpack.ProvidePlugin({
            os: 'os-browserify/browser',
        }),

    ],
    resolve: {
        // node polyfilss
        alias: {
            os: "os-browserify/browser",
            process: "process/browser",
            crypto: "crypto-browserify",
            stream: 'stream-browserify',
            https: 'https-browserify',
            http: 'stream-http',
        },
        fallback: {
            fs: false
        }
    },
};


