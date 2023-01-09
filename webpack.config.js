const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const {TsconfigPathsPlugin} = require('tsconfig-paths-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin')

const isProduction = process.argv[process.argv.indexOf('--mode') + 1] === 'production';
const isDevelopment = !isProduction;

module.exports = {
  devtool: isDevelopment ? 'eval-cheap-source-map' : undefined,
  entry: {
    protected: [
      path.resolve(__dirname, 'ui', 'app', 'common', 'fonts', 'index.ts'),
      path.resolve(__dirname, 'ui', 'app', 'protected', 'index.tsx'),
    ],
    public: [
      path.resolve(__dirname, 'ui', 'app', 'common', 'fonts', 'index.ts'),
      path.resolve(__dirname, 'ui', 'app', 'public', 'index.tsx'),
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: 'static/js/[name].[contenthash].bundle.js',
    assetModuleFilename: 'static/[hash][ext][query]',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/fonts/[hash][ext][query]',
        },
      },
      {
        test: /\.(tsx|ts)$/,
        include: path.resolve(__dirname, 'ui'),
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            plugins: [
              '@babel/plugin-transform-runtime',
              'babel-plugin-tsconfig-paths',
            ],
            presets: [
              ['@babel/preset-env', {
                'targets': 'last 2 versions',
              }],
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
          },
        }],
      },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      minChunks: Infinity,
    },
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['protected'],
      filename: 'protected/index.html',
      template: path.resolve(__dirname, 'ui', 'app', 'protected', 'index.html'),
      minify: false,
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['public'],
      filename: 'public/index.html',
      template: path.resolve(__dirname, 'ui', 'app', 'public', 'index.html'),
      minify: false,
    }),
    new CopyPlugin({
      patterns: [
        { from: 'node_modules/@vcmap/cesium/Source/', to: 'static/Source' },
      ],
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    plugins: [
      new TsconfigPathsPlugin(),
    ],
    fallback: {
      'https': require.resolve('https-browserify'),
      'http': require.resolve('stream-http'),
      'stream': require.resolve('stream-browserify'),
      'zlib': require.resolve('browserify-zlib'),
    },
  },
  devServer: {
    port: 8000,
    hot: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        // onProxyReq: function(proxyReq, req, res) {
        //  proxyReq.setHeader('X-REAL-IP', '192.168.42.33')
        // },
      },
      '/tilesets': {
        target: 'http://localhost:8080',
      },
    },
    static: {
      publicPath: '/',
      directory: path.resolve(__dirname, 'dist'),
    },
    historyApiFallback: {
      index: 'public/index.html',
      rewrites: [
        { from: /^\/protected/, to: 'protected/index.html' },
        { from: /^\/impressum/, to: 'public/index.html' },
        { from: /^\/datenschutz/, to: 'public/index.html' },
      ],
    },
    devMiddleware: {
      // Don't write files with hashes to disk e.g. hot-update.json
      // https://github.com/gaearon/react-hot-loader/issues/456#issuecomment-986973468
      writeToDisk: (filePath) => {
        return /^(?!.*(hot|bundle)).*/.test(filePath)
      },
    },
  },
}
