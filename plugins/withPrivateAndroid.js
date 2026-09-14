const fs = require("node:fs");
const path = require("node:path");
const {
  withAndroidManifest,
  withDangerousMod,
  withMainActivity,
} = require("@expo/config-plugins");

const withPrivateManifest = (config) =>
  withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application[0];
    application.$["android:allowBackup"] = "false";
    application.$["android:usesCleartextTraffic"] = "false";
    application.$["android:networkSecurityConfig"] =
      "@xml/mindvault_network_security";
    return config;
  });

const withSecureWindow = (config) =>
  withMainActivity(config, (config) => {
    let contents = config.modResults.contents;
    if (!contents.includes("import android.view.WindowManager")) {
      contents = contents.replace(
        "import android.os.Bundle",
        "import android.os.Bundle\nimport android.view.WindowManager",
      );
    }
    if (!contents.includes("WindowManager.LayoutParams.FLAG_SECURE")) {
      contents = contents.replace(
        "setTheme(R.style.AppTheme);",
        "setTheme(R.style.AppTheme);\n    window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)",
      );
    }
    config.modResults.contents = contents;
    return config;
  });

const withLocalCertificateTrust = (config) =>
  withDangerousMod(config, [
    "android",
    async (config) => {
      const xmlDirectory = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "xml",
      );
      fs.mkdirSync(xmlDirectory, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDirectory, "mindvault_network_security.xml"),
        `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
      <!-- Required only for the user-installed local dashboard demo CA. -->
      <certificates src="user" />
    </trust-anchors>
  </base-config>
</network-security-config>
`,
      );
      return config;
    },
  ]);

module.exports = (config) =>
  withLocalCertificateTrust(
    withSecureWindow(withPrivateManifest(config)),
  );
