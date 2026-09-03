const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Model weight shards are bundled as assets so MoveNet works offline.
config.resolver.assetExts = [...config.resolver.assetExts, 'bin'];

// Local tooling artifacts that Metro's watcher should never crawl.
config.watchFolders = config.watchFolders || [];
config.resolver.blockList = [
  ...(config.resolver.blockList || []),
  /\\.pytest_cache[\\/]/,
  /\.venv[\\/]/,
  /__pycache__[\\/]/,
];

module.exports = config;
