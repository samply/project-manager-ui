const dotenv = require('dotenv').config();

module.exports = {
//    publicPath: process.env.VUE_APP_PUBLIC_PATH || './', // Fallback to './' if not set
    configureWebpack: {
        output: {
            libraryTarget: "system",
        },
    },
    chainWebpack: (config) => {
        if (config.plugins.has("SystemJSPublicPathWebpackPlugin")) {
            config.plugins.delete("SystemJSPublicPathWebpackPlugin");
        }
    },
    filenameHashing: false,
};
