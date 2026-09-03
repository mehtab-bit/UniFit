const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Model weight shards are bundled as assets so MoveNet works offline.
config.resolver.assetExts = [...config.resolver.assetExts, 'bin'];

// Local tooling artifacts that Metro's watcher should never crawl.
// blockList is a single RegExp; keep Metro's default and add our patterns.
// The crawler tests directory paths WITHOUT a trailing slash, so each pattern
// must accept end-of-string as a boundary too.
config.resolver.blockList = new RegExp(
  '(' +
    config.resolver.blockList.source +
    '|' +
    ['\\.pytest_cache', '\\.venv', '__pycache__']
      .map((d) => d + '([\\\\/]|$)')
      .join('|') +
    ')'
);

module.exports = config;
