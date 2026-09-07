// Required for react-native-reanimated (used by app/onboarding.tsx's
// floating/pulse animations) — the "react-native-reanimated/plugin" MUST be
// listed last in the plugins array, per Reanimated's own setup requirement.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-reanimated/plugin"],
  };
};
