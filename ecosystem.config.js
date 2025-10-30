module.exports = {
  apps: [{
    name: 'next-app',
    script: './node_modules/.bin/next',
    args: 'start',
    cwd: '/home/rsa-key-20250926/dd',

    // Instance settings
    instances: 1,
    exec_mode: 'fork',

    // Memory management  
    max_memory_restart: '1000M',

    // Restart strategy
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    exp_backoff_restart_delay: 100,

    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 10000,

    // Logging
    error_file: './next-app-error.log',
    out_file: './next-app-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NODE_OPTIONS: '--max-old-space-size=1024',
      NEXTAUTH_URL: 'https://app.exceltechnologies.in',
      NEXTAUTH_SECRET: 'f2acdc6404d6d0452fe161262d1d0d29566c2eb0bdb926f4f67d88cb7b26ec66'
    },

    // Advanced features
    shutdown_with_message: false
  }]
};

