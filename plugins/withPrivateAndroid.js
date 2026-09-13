const { withAndroidManifest } = require("@expo/config-plugins");
module.exports = (config) =>
  withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application[0];
    application.$["android:allowBackup"] = "false";
    application.$["android:usesCleartextTraffic"] = "false";
    return config;
  });
