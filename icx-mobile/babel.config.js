module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      "nativewind/babel",
      // "react-native-reanimated/plugin"  <-- THIS WAS THE PROBLEM. IT IS GONE NOW.
    ],
  };
};