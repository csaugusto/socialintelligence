module.exports = {
  apps: [
    {
      name:   'si-dashboard',
      cwd:    './dashboard',
      script: 'node_modules/.bin/next',
      args:   'start',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT:     3001,
      },
    },
    {
      name:   'si-pipeline',
      script: './src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      cron_restart: '*/15 * * * *', // fallback si el cron interno falla
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
