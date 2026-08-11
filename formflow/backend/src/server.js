const { createApp } = require('./app');
const { createPool, createFormsStore } = require('./db');

const port = Number(process.env.BACKEND_PORT || 3000);
const version = process.env.APP_VERSION || process.env.GIT_SHA || 'dev';

const pool = createPool();
const formsStore = createFormsStore(pool);
const app = createApp({ formsStore, version });

const server = app.listen(port, () => {
  console.log(`FormFlow backend listening on port ${port} (version ${version})`);
});

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down backend...`);
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
