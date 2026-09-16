module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins || []),
    ["expo-sqlite", { useSQLCipher: true }],
    ["expo-secure-store", { configureAndroidBackup: true }],
    "expo-local-authentication",
    ["llama.rn", { enableOpenCLAndHexagon: false }],
    "./plugins/withPrivateAndroid",
  ],
  experiments: {
    ...config.experiments,
    baseUrl: process.env.GITHUB_PAGES === "true" ? "/MindVault" : "",
  },
});
