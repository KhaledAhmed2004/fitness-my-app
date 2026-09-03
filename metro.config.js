const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// MENTOR: Point Metro at the CSS entry NativeWind compiles into RN styles.
module.exports = withNativeWind(config, { input: './global.css' });
