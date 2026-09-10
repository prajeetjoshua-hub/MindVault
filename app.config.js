module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.GITHUB_PAGES === 'true' ? '/MindVault' : '',
  },
});
