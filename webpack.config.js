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
 * All CSS is merged into one "styles" chunk (see optimization.splitChunks). By default the plugin
 * orders it by merging every lazy page's own order, which puts rsuite's base styles before most
 * page/component styles. Order it instead the way it was when everything was in one bundle: walk
 * the imports from the entry in source order, going into lazy import() pages where they appear.
 */
class OrderedCssExtractPlugin extends MiniCssExtractPlugin {
  sortModules(compilation, chunk, modules, requestShortener) {
    if (chunk.name !== 'styles' || !modules) {
      return super.sortModules(compilation, chunk, modules, requestShortener);
    }
    const cached = this._sortedModulesCache.get(chunk);
    if (cached) return cached;

    const { moduleGraph } = compilation;
    const cssModules = new Set(modules);
    // Production concatenates modules; walk the original modules so source order is kept
    const originalModule = module => (module && module.rootModule) || module;
    const position = loc => {
      const start = loc && loc.start;
      return start ? start.line * 1e6 + start.column : Number.MAX_SAFE_INTEGER;
    };
    const bySourceOrder = deps =>
      deps
        .map((item, index) => ({ ...item, index }))
        .sort((a, b) => a.pos - b.pos || a.index - b.index)
        .map(({ dep }) => originalModule(moduleGraph.getResolvedModule(dep) || moduleGraph.getModule(dep)));
    // Static imports run first (they are hoisted, wherever they are written), then lazy import()s
    const childrenOf = module => {
      const staticDeps = module.dependencies.map(dep => ({ dep, pos: position(dep.loc) }));
      const lazyDeps = (module.blocks || []).flatMap(block =>
        block.dependencies.map(dep => ({ dep, pos: position(dep.loc || block.loc) }))
      );
      return [...bySourceOrder(staticDeps), ...bySourceOrder(lazyDeps)].filter(Boolean);
    };

    const ordered = new Set();
    const visited = new Set();
    const entryDeps = [...compilation.entries.values()].flatMap(entry => entry.dependencies);
    for (const entryModule of entryDeps.map(dep => originalModule(moduleGraph.getResolvedModule(dep))).filter(Boolean)) {
      if (visited.has(entryModule)) continue;
      visited.add(entryModule);
      // Iterative post-order walk (the import graph is too deep for recursion)
      const stack = [{ module: entryModule, children: childrenOf(entryModule), next: 0 }];
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top.next < top.children.length) {
          const child = top.children[top.next++];
          if (!visited.has(child)) {
            visited.add(child);
            stack.push({ module: child, children: childrenOf(child), next: 0 });
          }
        } else {
          stack.pop();
          if (cssModules.has(top.module)) ordered.add(top.module);
        }
      }
    }
    // Anything the walk did not reach keeps the plugin's default order, after the rest
    for (const module of super.sortModules(compilation, chunk, modules, requestShortener)) {
      ordered.add(module);
    }
    this._sortedModulesCache.set(chunk, ordered);
    return ordered;
  }
}

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
    // HIS JWT / cookies on /proxy otherwise make Node answer 431, which
    // Stimulsoft displays as "Connection error: Connection error".
    server: {
      type: 'http',
      options: {
        maxHeaderSize: 1024 * 1024,
      },
    },
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
    // Content hash so browsers fetch the new page chunks after a deploy instead of cached old ones
    chunkFilename: '[name].[contenthash].chunk.js',
    publicPath: isProduction ? './' : '/',
    clean: true,
  },
  optimization: {
    splitChunks: {
      chunks: 'async',
      cacheGroups: {
        // Many component/page .less files style shared rsuite elements app-wide, so keep all CSS
        // in one stylesheet loaded up front (as before) while the JS stays split per page
        styles: {
          name: 'styles',
          type: 'css/mini-extract',
          chunks: 'all',
          enforce: true,
        },
      },
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
    new OrderedCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
      // Lazy pages import shared .less files in different orders; the styles don't depend on that order
      ignoreOrder: true,
    }),
  ],
};
 