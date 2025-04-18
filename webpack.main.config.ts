import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/index.ts',
  // Put your normal webpack config below here
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
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
};
