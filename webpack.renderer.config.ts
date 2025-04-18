import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins: [
    // Your existing plugins...

    // Add the Monaco webpack plugin
    new MonacoWebpackPlugin({
      languages: ['javascript', 'typescript', 'html', 'css', 'json', 'markdown',
        'python', 'java', 'cpp', 'csharp', 'go', 'php', 'ruby', 'rust', 'swift'],
      features: ['!gotoSymbol']
    })
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    fallback: {
      "path": require.resolve("path-browserify")
    }
  },
};
