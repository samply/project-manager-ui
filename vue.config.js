const fs = require('fs');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// The standalone page loads its single-spa runtime from vendor/ instead of a
// CDN: bridgeheads run in hospital networks that often block the internet.
// public/index.html references these files, so dev server and build serve
// the same URLs (the dev server keeps them in memory, the build writes dist/vendor/).
const vendorFiles = [
    'systemjs/dist/system.min.js',
    'systemjs/dist/extras/amd.min.js',
    'single-spa/lib/es2015/system/single-spa.min.js',
    'import-map-overrides/dist/import-map-overrides.js',
    'regenerator-runtime/runtime.js',
];

// Same policy as production (docker/start.sh), filled from the dev
// config.json and only reported, so violations show up in the console
// without blocking anything while developing.
function devContentSecurityPolicy() {
    const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'public/config.json'), 'utf8'));
    const origins = {
        BACKEND_ORIGIN: new URL(config.VUE_APP_BACKEND_URL).origin,
        OIDC_ORIGIN: new URL(config.VUE_APP_OIDC_URL).origin,
    };
    return fs.readFileSync(path.resolve(__dirname, 'docker/content-security-policy.template'), 'utf8')
        .split('\n').filter((line) => !line.startsWith('#')).join('\n')
        .replace(/\$\{(\w+)\}/g, (match, name) => origins[name] ?? match)
        .replace(/\s+/g, ' ')
        .trim();
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
            new (require('webpack')).DefinePlugin({
                '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': 'false',
            }),
            new CopyWebpackPlugin({
                patterns: vendorFiles.map((file) => ({
                    from: path.resolve(__dirname, 'node_modules', file),
                    to: 'vendor/[name][ext]',
                })),
            })
        ],
    },
    chainWebpack: (config) => {
        if (config.plugins.has("SystemJSPublicPathWebpackPlugin")) {
            config.plugins.delete("SystemJSPublicPathWebpackPlugin");
        }

        // The plugin injects its bootstrap scripts from cdn.jsdelivr.net
        // (hardcoded). public/index.html contains the same bootstrap with the
        // vendor/ files instead.
        if (config.plugins.has("StandaloneSingleSpaPlugin")) {
            config.plugins.delete("StandaloneSingleSpaPlugin");
        }

        // silentRenew belongs only to silent-renew.html.
        // inject: false - public/index.html loads the app through the import
        // map (SystemJS), not with a plain <script> tag.
        // title: shown in the browser tab until the app boots and replaces it
        // with the backend-configured PAGE_TITLE (see router/index.ts) - falls
        // back to the package name ("project-manager-ui") otherwise.
        config.plugin('html').tap((args) => {
            args[0].chunks = ['app'];
            args[0].inject = false;
            args[0].title = 'Data Request';
            return args;
        });

        config.devServer.headers({
            ...config.devServer.get('headers'),
            'Content-Security-Policy-Report-Only': devContentSecurityPolicy(),
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
