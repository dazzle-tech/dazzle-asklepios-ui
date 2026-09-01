/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
 
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
    historyApiFallback: { disableDotRule: true },
    static: {
      directory: path.resolve(__dirname, 'public'),
      publicPath: '/',
    },
    devMiddleware: {
      publicPath: '/',
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
 