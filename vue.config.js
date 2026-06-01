const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    configureWebpack: {
        entry: {
            silentRenew: path.resolve(__dirname, 'src/services/silent-renew.ts'),
        },
        output: {
            filename: 'js/[name].js',  // ensures silentRenew.js is under /js
            libraryTarget: "system",
        },
        plugins: [
            new (require('webpack')).DefinePlugin({
                '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': 'false',
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.resolve(__dirname, 'node_modules/systemjs/dist/system.min.js'),
                        to: 'system.min.js'   // copies to /dist/system.min.js
                    }
                ]
            })
        ],
    },
    chainWebpack: (config) => {
        if (config.plugins.has("SystemJSPublicPathWebpackPlugin")) {
            config.plugins.delete("SystemJSPublicPathWebpackPlugin");
        }
        config.module
            .rule('vue')
            .use('vue-loader')
            .tap(options => {
                options.compilerOptions = {
                    isCustomElement: tag => tag.startsWith('lens-')
                }
                return options
            })
    },
    filenameHashing: false,
};
