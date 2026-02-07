module.exports = {
  apps: [
    {
      name: "ai-jobs-worker",
      script: "npx",
      args: "tsx scripts/run-ai-jobs-worker.ts --interval=5000 --limit=20",
      exec_interpreter: "npx",
      watch: false,
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production"
      },
      error_file: "./logs/ai-jobs-worker-error.log",
      out_file: "./logs/ai-jobs-worker-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true
    }
  ]
};

