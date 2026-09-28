import { createServer, preview } from 'vite';
const production = process.argv.includes('--production');
const instances = [];
try {
  for (const port of [5173, 5174]) {
    const server = production
      ? await preview({ preview: { host: '127.0.0.1', port, strictPort: true } })
      : await createServer({ server: { host: '127.0.0.1', port, strictPort: true } });
    if (!production) await server.listen();
    instances.push(server);
    console.log(`${port === 5173 ? 'Editor' : 'Isolated preview'}: http://localhost:${port}`);
  }
} catch (error) {
  console.error(error);
  for (const server of instances) await (server.close ? server.close() : new Promise(resolve => server.httpServer.close(resolve)));
  process.exit(1);
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  for (const server of instances) await (server.close ? server.close() : new Promise(resolve => server.httpServer.close(resolve)));
  process.exit(0);
});
