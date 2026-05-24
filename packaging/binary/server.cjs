#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const process = require('node:process');
const { URL } = require('node:url');

const host = process.env.HOST || '0.0.0.0';
const port = Number.parseInt(process.env.PORT || '3000', 10);
const assetRoot = path.resolve(
  process.env.JELLYFIN_VUE_ASSETS || path.join(__dirname, 'dist')
);
const indexPath = path.join(assetRoot, 'index.html');
const configPath = path.join(assetRoot, 'config.json');

const mimeTypes = new Map([
  ['.avif', 'image/avif'],
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.wasm', 'application/wasm'],
  ['.webm', 'video/webm'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2']
]);

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  fail(`Invalid PORT value: ${process.env.PORT}`);
}

if (!fs.existsSync(indexPath)) {
  fail(`Missing frontend assets at ${assetRoot}. Build the frontend before packaging.`);
}

function runtimeConfig() {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const defaultServers = process.env.DEFAULT_SERVERS
    ? process.env.DEFAULT_SERVERS.split(',').map((server) => server.trim()).filter(Boolean)
    : [];

  config.defaultServerURLs = defaultServers;
  config.allowServerSelection = process.env.DISABLE_SERVER_SELECTION !== '1';
  config.routerMode = process.env.HISTORY_ROUTER_MODE === '0' ? 'hash' : 'history';

  return `${JSON.stringify(config, null, 2)}\n`;
}

function send(res, statusCode, headers, body = '') {
  res.writeHead(statusCode, headers);
  res.end(body);
}

function sendFile(req, res, filePath) {
  const type = mimeTypes.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream';

  res.writeHead(200, {
    'Cache-Control': filePath === indexPath ? 'no-cache' : 'public, max-age=31536000, immutable',
    'Content-Type': type
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  fs.createReadStream(filePath).pipe(res);
}

function safeAssetPath(pathname) {
  let decoded;

  try {
    decoded = decodeURIComponent(pathname);
  }
  catch {
    return undefined;
  }

  if (decoded.includes('\0')) {
    return undefined;
  }

  const relativePath = path.normalize(decoded).replace(/^[/\\]+/, '');
  const resolved = path.resolve(assetRoot, relativePath || 'index.html');

  if (resolved !== assetRoot && !resolved.startsWith(`${assetRoot}${path.sep}`)) {
    return undefined;
  }

  return resolved;
}

function resolveFile(pathname) {
  const requestedPath = safeAssetPath(pathname);

  if (!requestedPath) {
    return undefined;
  }

  if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
    return requestedPath;
  }

  if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isDirectory()) {
    const nestedIndex = path.join(requestedPath, 'index.html');

    if (fs.existsSync(nestedIndex)) {
      return nestedIndex;
    }
  }

  return path.extname(requestedPath) ? undefined : indexPath;
}

function handleRequest(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, { Allow: 'GET, HEAD' }, 'Method not allowed\n');
    return;
  }

  const url = new URL(req.url || '/', 'http://localhost');

  if (url.pathname === '/config.json') {
    send(res, 200, {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json; charset=utf-8'
    }, req.method === 'HEAD' ? '' : runtimeConfig());
    return;
  }

  const filePath = resolveFile(url.pathname);

  if (!filePath) {
    send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not found\n');
    return;
  }

  sendFile(req, res, filePath);
}

const server = http.createServer(handleRequest);

server.listen(port, host, () => {
  console.log(`Jellyfin Vue is listening on http://${host}:${port}`);
});
