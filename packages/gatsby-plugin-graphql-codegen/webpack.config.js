// const nodeExternals = require('webpack-node-externals')

module.exports = {
  entry: './src/gatsby-node.ts',
  target: 'node',
  output: {
    filename: 'gatsby-node.js',
    path: __dirname,
    libraryTarget: 'commonjs'
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  externals: [
    {
      'fs-extra': 'commonjs2 fs-extra',
      'lodash.debounce': 'commonjs lodash.debounce',
      'graphql': 'commonjs graphql',
      'gatsby/graphql': 'commonjs gatsby/graphql'
    },
    function(ctx, req, cb) {
      if (
        req.includes('@graphql-toolkit') ||
        req.includes('@graphql-codegen')
      ) {
        console.log(req)
        return cb(null, 'commonjs ' + req);
      }
      cb()
    }
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/, 
        loader: "ts-loader",
        exclude: /node_modules/,
      }
    ]
  }
}