// Only initialise the selected app, so the public demo does not initialise native services.
export default process.env.EXPO_PUBLIC_APP_VARIANT === "prototype"
  ? require("./apps/mobile/App").default
  : require("./src/MindVault").default;
