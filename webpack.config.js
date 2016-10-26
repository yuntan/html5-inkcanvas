const path = require('path');

const nodeModulesPath = path.resolve(__dirname, 'node_modules');

module.exports = {
  entry: './index.ts',
  output: {
    filename: './build/bundle.js',
  },
  devtool: 'source-map',
  resolve: {
    // Add '.ts' and '.tsx' as a resolvable extension.
    extensions: ['', '.ts', '.tsx', '.js'],
  },
  module: {
    loaders: [
      // all files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
      { test: /\.tsx?$/, loader: 'ts-loader', exclude: [nodeModulesPath] },
    ],
  },
}
