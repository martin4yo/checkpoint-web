module.exports = {
  apps: [{
    name: 'checkpoint-web',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/checkpoint-web',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8086
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8086
    }
  }]
}