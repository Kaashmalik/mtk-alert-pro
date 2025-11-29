/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = function(options) {
  return {
    ...options,
    entry: ['./src/main.ts'],
    externals: [
      nodeExternals({
        allowlist: [/@mtk\/.*/],  // Bundle workspace packages
        modulesFromFile: true,
      }),
    ],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              configFile: 'tsconfig.json',
            },
          },
          exclude: /node_modules\/(?!@mtk)/,  // Don't exclude @mtk packages
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@mtk/database': path.resolve(__dirname, '../../packages/database/src'),
        '@mtk/config': path.resolve(__dirname, '../../packages/config/src'),
        '@': path.resolve(__dirname, './src'),
      },
    },
    output: {
      ...options.output,
      libraryTarget: 'commonjs2',
    },
  };
};
