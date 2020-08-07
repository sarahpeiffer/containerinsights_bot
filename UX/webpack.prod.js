var webpack = require('webpack');
var merge = require('webpack-merge');
var common = require('./webpack.common');

module.exports = merge(common, {
  plugins: [
      new webpack.DefinePlugin({
          // Environment helpers
          'process.env': {
              NODE_ENV: JSON.stringify('production')
          }
      }),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.UglifyJsPlugin({
        comments: false,
        compress: {
          drop_console: true
        }

      }), //minify everything
      new webpack.optimize.AggressiveMergingPlugin() //Merge chunks
  ]
});
