import type { Configuration } from 'webpack';
import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';
import MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

export const rendererConfig: Configuration = {
  module: {
    rules: [
      ...rules,
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
      },
      {
        test: /\.ttf$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    ...plugins,
    new MonacoWebpackPlugin({
      languages: ['javascript', 'typescript', 'html', 'css', 'json', 'markdown',
        'python', 'java', 'cpp', 'csharp', 'go', 'php', 'ruby', 'rust', 'swift'],
      features: ['bracketMatching', 'caretOperations', 'clipboard', 'colorPicker', 'comment', 'find', 'folding', 'format', 'hover', 'inPlaceReplace', 'smartSelect', 'snippet', 'suggest', '!gotoSymbol'],
      filename: '[name].worker.js', // Make sure this is explicitly set
    })
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    fallback: {
      path: require.resolve('path-browserify'),
    },
  },
};