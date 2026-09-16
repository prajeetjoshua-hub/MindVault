const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// Expo inlines public variables. Never share transformed modules between the two apps.
config.cacheVersion = `mindvault-${process.env.EXPO_PUBLIC_APP_VARIANT === 'prototype' ? 'prototype' : 'landing'}-${process.env.GITHUB_PAGES === 'true' ? 'pages' : 'local'}-v1`;
module.exports = config;
