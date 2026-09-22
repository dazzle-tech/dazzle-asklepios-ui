/**
 * Host for stimulsoft-data-adapter so Designer SQL / PostgreSQL
 * Test Connection can run beside HIS REST /api sources.
 *
 * The package's own `node index.js` exits on an empty body (JSON.parse).
 */
const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');
const candidates = [
  path.join(root, 'node_modules', 'stimulsoft-data-adapter'),
  path.join(
    root,
    'node_modules',
    'stimulsoft-dashboards-js',
    'node_modules',
    'stimulsoft-data-adapter'
  ),
  path.join(
    root,
    'node_modules',
    'stimulsoft-reports-js',
    'node_modules',
    'stimulsoft-data-adapter'
  ),
];

const adapterDir = candidates.find(dir =>
  fs.existsSync(path.join(dir, 'index.js'))
);
if (!adapterDir) {
  console.error('stimulsoft-data-adapter not found. Run npm install.');
  process.exit(1);
}

const adapter = require(adapterDir);
const port = Number(process.env.STIMULSOFT_SQL_ADAPTER_PORT || 9615);

const server = http.createServer((request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  response.setHeader(
    'Access-Control-Allow-Methods',
    'POST, GET, OPTIONS, DELETE, PUT'
  );
  response.setHeader('Cache-Control', 'no-cache');

  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.end();
    return;
  }

  let data = '';
  request.on('data', buffer => {
    data += buffer;
  });
  request.on('end', () => {
    if (!String(data).trim()) {
      response.end(
        JSON.stringify({
          success: true,
          notice: 'Stimulsoft data adapter is running',
        })
      );
      return;
    }
    try {
      const command = adapter.getCommand(data);
      adapter.process(command, result => {
        response.end(adapter.getResponse(result));
      });
    } catch (error) {
      response.statusCode = 400;
      response.end(
        JSON.stringify({
          success: false,
          notice: error instanceof Error ? error.message : String(error),
        })
      );
    }
  });
});

server.on('error', error => {
  console.error(error);
  process.exit(1);
});

server.listen(port, () => {
  console.log(`The DataAdapter run on port ${port}`);
  console.log(
    'StiOptions.WebServer.url = "/proxy" (webpack) or "http://localhost:' +
      port +
      '"'
  );
});
