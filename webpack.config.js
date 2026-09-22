/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');
 
const express = require('express');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlwebpackPlugin = require('html-webpack-plugin');
 
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Copy Stimulsoft designer/viewer scripts into public/ so they are served as
 * static files and never enter the webpack application bundle.
 * Missing files are skipped (e.g. if the npm package is not installed).
 * Prefer Dashboards.JS so reports, dashboards, viewer, and designer stay on
 * the same product version.
 */
function copyStimulsoftAssets() {
  const dest = path.resolve(__dirname, 'public/stimulsoft');
  fs.mkdirSync(dest, { recursive: true });
  const packageRoots = [
    path.resolve(__dirname, 'node_modules/stimulsoft-dashboards-js'),
    path.resolve(__dirname, 'node_modules/stimulsoft-reports-js'),
  ];
  const files = [
    'stimulsoft.reports.pack.js',
    'stimulsoft.dashboards.pack.js',
    'stimulsoft.viewer.pack.js',
    'stimulsoft.designer.pack.js',
  ];
  for (const file of files) {
    const src = packageRoots
      .map(root => path.join(root, 'Scripts', file))
      .find(candidate => fs.existsSync(candidate));
    if (!src) continue;
    const out = path.join(dest, file);
    const srcMtime = fs.statSync(src).mtimeMs;
    const shouldCopy = !fs.existsSync(out) || fs.statSync(out).mtimeMs < srcMtime;
    if (shouldCopy) {
      fs.copyFileSync(src, out);
    }
  }
}
copyStimulsoftAssets();

/**
 * Same-origin Stimulsoft / HIS API proxy for local `webpack serve`.
 * REST JSON sources: /api → Spring Boot (HIS).
 * SQL Test Connection / queries: /proxy → Node stimulsoft-data-adapter (:9615).
 *
 * HIS:  STIMULSOFT_PROXY_TARGET=http://localhost:8080
 * SQL:  STIMULSOFT_SQL_ADAPTER_URL=http://localhost:9615
 * Java adapter on Spring: STIMULSOFT_SQL_ADAPTER_URL=http://localhost:8080
 *                         STIMULSOFT_PROXY_STRIP_PATH=false
 */
const hisApiProxyTarget =
  process.env.STIMULSOFT_PROXY_TARGET || 'http://localhost:8080';
const sqlAdapterPort = Number(process.env.STIMULSOFT_SQL_ADAPTER_PORT || 9615);
const sqlAdapterTarget =
  process.env.STIMULSOFT_SQL_ADAPTER_URL ||
  `http://localhost:${sqlAdapterPort}`;
const sqlAdapterStripPath =
  process.env.STIMULSOFT_PROXY_STRIP_PATH !== 'false';

/**
 * Designer SQL (including PostgreSQL Test Connection) posts to /proxy.
 * Webpack forwards that to the Node data adapter. Start it with the dev
 * server when the target is this machine, so Test Connection is not
 * ECONNREFUSED on :9615.
 */
let sqlAdapterChild = null;
function ensureStimulsoftSqlAdapter() {
  let target;
  try {
    target = new URL(sqlAdapterTarget);
  } catch {
    return;
  }
  const local =
    target.hostname === 'localhost' || target.hostname === '127.0.0.1';
  if (!local || String(target.port || '80') !== String(sqlAdapterPort)) return;

  const probe = net.connect({ host: '127.0.0.1', port: sqlAdapterPort });
  const start = () => {
    if (sqlAdapterChild) return;
    sqlAdapterChild = spawn(
      process.execPath,
      [path.resolve(__dirname, 'scripts/stimulsoft-data-adapter.js')],
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          STIMULSOFT_SQL_ADAPTER_PORT: String(sqlAdapterPort),
        },
      }
    );
    sqlAdapterChild.on('exit', () => {
      sqlAdapterChild = null;
    });
    const stop = () => {
      if (sqlAdapterChild && !sqlAdapterChild.killed) sqlAdapterChild.kill();
    };
    process.once('exit', stop);
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  };
  probe.on('connect', () => probe.end());
  probe.on('error', start);
}

const forwardHisAuthHeaders = (proxyReq, req) => {
  const authorization = req.headers.authorization || req.headers.Authorization;
  if (authorization) {
    proxyReq.setHeader('Authorization', authorization);
  }
  const idToken = req.headers.id_token || req.headers['id-token'];
  if (idToken) {
    proxyReq.setHeader('id_token', idToken);
  }
};

const hisApiProxyOptions = {
  target: hisApiProxyTarget,
  changeOrigin: true,
  secure: false,
  logLevel: 'warn',
  onProxyReq: forwardHisAuthHeaders,
};

// Check environment variable to determine if source maps should be generated
// In Docker, we set this to 'false' to save memory.
const generateSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';
 
module.exports = {
  entry: './src/index.tsx',
  // FIXED: Only generate source maps if the environment variable allows it
  devtool: generateSourceMap ? 'source-map' : false,
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  devServer: {
    host: '0.0.0.0',
    port: 3100,
    hot: true,
    liveReload: false,
    allowedHosts: 'all',
    client: {
      overlay: {
        runtimeErrors: error => {
          const message = String(error?.message || error || '');
          const stack = String(error?.stack || '');
          if (message === 'Unauthorized' || message.includes('Unauthorized')) {
            return false;
          }
          if (
            stack.includes('StiDictionaryHelper') ||
            stack.includes('synchronizeDictionary') ||
            stack.includes('StiMobileDesigner') ||
            stack.includes('ZoomPage') ||
            message.includes("reading 'forEach'") ||
            message.includes("reading 'repaint'")
          ) {
            return false;
          }
          return true;
        },
      },
    },
    // HashRouter does not need SPA fallback. The CLI --history-api-fallback flag
    // was serving index.html for /api, which Stimulsoft then parsed as JSON.
    historyApiFallback: false,
    static: {
      directory: path.resolve(__dirname, 'public'),
      publicPath: '/',
    },
    devMiddleware: {
      publicPath: '/',
    },
    proxy: [
      {
        context: ['/api'],
        ...hisApiProxyOptions,
      },
      {
        context: ['/proxy'],
        target: sqlAdapterTarget,
        changeOrigin: true,
        secure: false,
        logLevel: 'warn',
        ...(sqlAdapterStripPath ? { pathRewrite: { '^/proxy': '' } } : {}),
      },
    ],
    setupMiddlewares: middlewares => {
      ensureStimulsoftSqlAdapter();
      // Serve public/ (including Stimulsoft pack scripts) before
      // webpack-dev-middleware. Otherwise /stimulsoft/*.pack.js waits for the
      // ~100MB app bundle and the designer <script> tag times out.
      middlewares.unshift({
        name: 'public-static-first',
        middleware: express.static(path.resolve(__dirname, 'public'), {
          index: false,
          fallthrough: true,
        }),
      });
      return middlewares;
    },
  },
  output: {
    path: path.resolve(__dirname, 'assets'),
    filename: 'bundle.js',
    chunkFilename: '[name].chunk.js',
    publicPath: isProduction ? './' : '/',
    clean: true,
  },
  optimization: {
    splitChunks: {
      chunks: 'async',
    },
  },
 
  module: {
    rules: [
      // TS/TSX
      {
        test: /\.tsx?$/,
        use: ['babel-loader'],
        exclude: /node_modules/,
      },
 
      // Images
      {
        test: /\.(jpg|png|svg)$/i,
        type: 'asset',
        parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
        generator: { publicPath: '/', filename: 'images/[name][ext]' },
      },
 
      {
        test: /tw\.build\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
 
 
      {
        test: /\.css$/i,
        exclude: /tw\.build\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { importLoaders: 1, url: true },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                config: false,
                plugins: [require('@tailwindcss/postcss')],
              },
            },
          },
        ],
      },
 
      {
        test: /\.less$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'less-loader',
            options: {
              // FIXED: Also disable source maps for LESS if needed
              sourceMap: generateSourceMap,
              lessOptions: { javascriptEnabled: true },
            },
          },
        ],
      },
 
      {
        test: /\.(woff2?|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: { filename: 'fonts/[name][ext]' },
      },
    ],
  },
 
  plugins: [
    new HtmlwebpackPlugin({
      title: 'Title',
      filename: 'index.html',
      template: './src/index.html',
      inject: true,
      hash: true,
      publicPath: isProduction ? './' : '/',
      favicon: './public/default-favicon.png',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
  ],
};
 