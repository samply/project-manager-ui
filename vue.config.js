const dotenv = require('dotenv').config();

module.exports = {
//    publicPath: process.env.VUE_APP_PUBLIC_PATH || './', // Fallback to './' if not set
    configureWebpack: {
        output: {
            libraryTarget: "system",
        },
        plugins: [
            new (require('webpack')).DefinePlugin({
                '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': 'false', // Set the flag globally to avoid hydration mismatch details
            }),
        ],
    },
    chainWebpack: (config) => {
        if (config.plugins.has("SystemJSPublicPathWebpackPlugin")) {
            config.plugins.delete("SystemJSPublicPathWebpackPlugin");
        }
    },
    filenameHashing: false,
};
