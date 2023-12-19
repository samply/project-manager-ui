const dotenv = require('dotenv').config();

module.exports = {
    configureWebpack: {
        output: {
            libraryTarget: "system",
        },
    },
    chainWebpack: (config) => {
        if (config.plugins.has("SystemJSPublicPathWebpackPlugin")) {
            config.plugins.delete("SystemJSPublicPathWebpackPlugin");
        }
        config.plugin('define').tap((args) => {
            const env = dotenv.parsed;
            args[0]['process.env'] = {
                ...args[0]['process.env'],
                ...env,
            };
            return args;
        });
    },
    filenameHashing: false,
};
