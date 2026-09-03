/**
 * MENTOR: NativeWind v4 + Expo Router setup lives INSIDE the app root (my-app),
 * not the parent folder. Metro/Babel resolve from this directory.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
