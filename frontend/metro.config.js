const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': path.resolve(__dirname),
  '@/screens': path.resolve(__dirname, 'app/screens'),
  '@/constants': path.resolve(__dirname, 'app/constants'),
};

module.exports = config;
