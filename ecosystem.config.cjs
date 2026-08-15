module.exports = {
  apps: [
    {
      name: "FlixworldFrontend",
      cwd: "/var/www/flixworld.xyz/frontend",
      script: "node_modules/.bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1200M",
      node_args: "--max-old-space-size=768 --disable-proto=throw",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        // Cap the Next.js SSR worker thread pool to 2 on a constrained VPS.
        // Default is based on CPU count — on a 4-core VPS this spawns too many workers.
        NEXT_WORKER_THREADS: "2",
      },
      time: true,
    },
  ],
};
