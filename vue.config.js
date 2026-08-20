const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// HtmlWebpackPlugin normalizes publicPath './' to '' (empty string), which the
// standalone-single-spa-webpack-plugin sees as falsy and falls back to '/'. This
// produces absolute import map URLs like "/js/app.hash.js" that break sub-path
// deployments where start.sh sets <base href="/requester/"> — SystemJS cannot
// resolve absolute paths through the <base> tag. This plugin runs after
// StandaloneSingleSpaPlugin and rewrites those absolute paths to relative ones.
class RelativeImportMapPlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap('RelativeImportMapPlugin', (compilation) => {
            const HtmlWebpackPlugin = require('html-webpack-plugin');
            HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
                'RelativeImportMapPlugin',
                (data, cb) => {
                    data.html = data.html.replace(/"\/js\//g, '"./js/');
                    cb(null, data);
                }
            );
        });
    }
}

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
            // silentRenew must keep a fixed name because silent-renew.html references it statically.
            // All other entry chunks (app) get a content hash so browsers fetch fresh bundles on deploy.
            filename: (pathData) =>
                pathData.chunk.name === 'silentRenew' ? 'js/[name].js' : 'js/[name].[contenthash:8].js',
            libraryTarget: "system",
        },
        plugins: [
            new RelativeImportMapPlugin(),
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
    filenameHashing: true,
};
