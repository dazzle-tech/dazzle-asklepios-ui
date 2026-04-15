/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlwebpackPlugin = require('html-webpack-plugin');

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
    publicPath: './',
    clean: true,
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
      title: 'OneHealth',
      filename: 'index.html',
      template: './src/index.html',
      inject: true,
      hash: true,
      path: './',
     favicon: './public/r-and-d-projects.atlassian1.png',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
  ],
};

