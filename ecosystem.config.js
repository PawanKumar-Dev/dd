module.exports = {
  apps: [{
    name: 'next-app',
    script: 'npm',
    args: 'start',
    
    // Instance settings
    instances: 1,
    exec_mode: 'fork',
    
    // Node.js arguments for better memory management
    node_args: '--max-old-space-size=1024 --expose-gc',

    // Memory management
    max_memory_restart: '1G',

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
      PORT: 3000
    },

    // Advanced features
    wait_ready: true,
    shutdown_with_message: true
  }]
};

