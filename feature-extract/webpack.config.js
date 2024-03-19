const path = require('path')

module.exports = {
  entry: {
    main: './src/index.ts'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader'
      }
    ]
  },
  mode: 'development',
  target: 'node',
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      'express-handlebars': 'handlebars/dist/handlebars.js',
      'ejs': 'ejs.min.js'
    }
  },
  devtool: 'source-map',
  stats: {
    warnings: false,
  }
}
