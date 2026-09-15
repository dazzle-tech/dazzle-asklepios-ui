/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
 
const express = require('express');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlwebpackPlugin = require('html-webpack-plugin');
 
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Copy Stimulsoft designer/viewer scripts into public/ so they are served as
 * static files and never enter the webpack application bundle.
 * Missing files are skipped (e.g. if the npm package is not installed).
 */
function copyStimulsoftAssets() {
  const srcRoot = path.resolve(__dirname, 'node_modules/stimulsoft-reports-js');
  const dest = path.resolve(__dirname, 'public/stimulsoft');
  if (!fs.existsSync(srcRoot)) {
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  const candidates = [
    ['Scripts/stimulsoft.reports.pack.js', 'stimulsoft.reports.pack.js'],
    ['Scripts/stimulsoft.viewer.pack.js', 'stimulsoft.viewer.pack.js'],
    ['Scripts/stimulsoft.designer.pack.js', 'stimulsoft.designer.pack.js'],
  ];
  for (const [from, to] of candidates) {
    const src = path.join(srcRoot, from);
    const out = path.join(dest, to);
    if (!fs.existsSync(src)) continue;
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
 * Designer JSON sources call /api/... ; SQL adapter calls /proxy.
 * Webpack forwards both to Spring Boot with the browser JWT.
 *
 * Spring Boot: STIMULSOFT_PROXY_TARGET=http://localhost:8080
 * Node adapter: STIMULSOFT_PROXY_TARGET=http://localhost:9615
 *               STIMULSOFT_PROXY_STRIP_PATH=true
 */
const stimulsoftProxyTarget =
  process.env.STIMULSOFT_PROXY_TARGET || 'http://localhost:8080';
const stimulsoftProxyStripPath =
  process.env.STIMULSOFT_PROXY_STRIP_PATH === 'true';

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
  target: stimulsoftProxyTarget,
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
        context: ['/api', '/proxy'],
        ...hisApiProxyOptions,
        ...(stimulsoftProxyStripPath
          ? { pathRewrite: { '^/proxy': '/' } }
          : {}),
      },
    ],
    setupMiddlewares: middlewares => {
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
 