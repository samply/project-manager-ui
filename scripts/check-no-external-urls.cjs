// Fails the standalone build if the entry pages load anything from another
// host (e.g. a CDN). Bridgeheads run in networks without internet access, so
// everything must be served by the frontend itself (see vue.config.js).
const fs = require('fs');
const path = require('path');

const dist = path.resolve(__dirname, '..', 'dist');
const files = ['index.html', 'silent-renew.html', 'bootstrap.js', 'clear-import-map-overrides.js'];
// http://, https:// and protocol-relative //host
const externalUrl = /\bhttps?:\/\/|["'(=]\s*\/\/[A-Za-z0-9]/g;

let failed = false;
for (const file of files) {
    const content = fs.readFileSync(path.join(dist, file), 'utf8');
    for (const match of content.matchAll(externalUrl)) {
        const line = content.slice(0, match.index).split('\n').length;
        console.error(`${file}:${line}: external URL: ${content.split('\n')[line - 1].trim()}`);
        failed = true;
    }
}

if (failed) {
    console.error('The frontend must not load anything from other hosts. Serve the file from vendor/ instead.');
    process.exit(1);
}
console.log(`No external URLs in ${files.join(', ')}.`);
