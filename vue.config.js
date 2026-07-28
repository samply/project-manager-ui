const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const applicationName = require('./package.json').name;

module.exports = {
    // Bootstrap resources must be relative because runtime config is not
    // available until after the application bundle has loaded.
    publicPath: './',
    devServer: {
        // Let Vue Router handle direct navigation and browser refreshes.
        historyApiFallback: true,
    },
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

        // silentRenew belongs only to silent-renew.html.
        config.plugin('html').tap((args) => {
            args[0].chunks = ['app'];
            return args;
        });

        // Keep the standalone Single-SPA import relative as well.
        if (config.plugins.has("StandaloneSingleSpaPlugin")) {
            config.plugin("StandaloneSingleSpaPlugin").tap((args) => {
                args[0].importMap = {
                    imports: {
                        [applicationName]: './js/app.js',
                    },
                };
                return args;
            });
        }

        config.module
            .rule('vue')
            .use('vue-loader')
            .tap((options = {}) => ({
                ...options,
                compilerOptions: {
                    ...(options.compilerOptions || {}),
                    isCustomElement: (tag) => tag.startsWith('lens-')
                }
            }));
    },
    filenameHashing: false,
};
