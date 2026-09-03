const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Model weight shards are bundled as assets so MoveNet works offline.
config.resolver.assetExts = [...config.resolver.assetExts, 'bin'];

module.exports = config;
