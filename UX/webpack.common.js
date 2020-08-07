var ExtractTextPlugin = require('extract-text-webpack-plugin');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var OptimizeJsPlugin = require('optimize-js-plugin');

var path = require('path');

module.exports = {
  entry: {
    'compute-perf': './src/scripts/compute-perf.tsx',
    'single-compute-perf': './src/scripts/single-compute-perf.tsx',
    'single-compute-map': './src/scripts/single-compute-map.tsx',
    'scale-compute-map': './src/scripts/scale-compute-map.tsx',
    'container-perf': './src/scripts/container-perf.tsx',
    'multicluster-health': './src/scripts/multicluster-health.tsx',
    'sfmesh-perf': './src/scripts/sfmesh-perf.tsx',
    'container-preload': './src/scripts/container-preload.ts',
    'container-preload-worker': './src/scripts/container-preload-worker.ts',
    'container-deployments': './src/scripts/container/deployments/entry.ts',
    'container-health': './src/scripts/container/health/index.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.css', '.less']
  },
  module: {
    rules: [{
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          use: ['css-loader'],
          fallback: 'style-loader'
        })
      },
      {
        test: /\.less$/,
        use: ExtractTextPlugin.extract({
          use: ['css-loader', 'less-loader'],
          fallback: 'style-loader'
        })
      },
      // Support for *.svg files inline.
      {
        test: /\.svg$/,
        exclude: [/node_modules/],
        loader: 'svg-react-loader'
      },
    ]
  },

  plugins: [
    new ExtractTextPlugin('[name].css'),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle.analysis/report.html',
      statsFilename: 'bundle.analysis/stats.js',
      openAnalyzer: false,
      generateStatsFile: true
    }),
    new OptimizeJsPlugin({
       sourceMap: false
    })
  ],

  externals: {
    'jquery': '$',
    'react': 'React',
    'react-dom': 'ReactDOM',
    'moment': 'moment',
    'd3': 'd3',
    'Q': 'q',
    'PillResources': 'window["PillResources"] || (window["PillResources"] = {})'
  }
};