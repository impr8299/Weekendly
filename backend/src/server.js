import { createApp } from './app.js';
import { config } from './config.js';
import { initSchema, pool } from './db.js';

async function main() {
  await initSchema();
  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`API listening on port ${config.port}`);
  });

  const shutdown = () => {
    server.close(() => pool.end().then(() => process.exit(0)));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});
