module.exports = (api, options) => {
  const { NODE_ENV } = options || process.env;
  const dev = NODE_ENV === 'development';
  // Keep ES modules when the caller (webpack's babel-loader) understands them, so webpack can
  // tree-shake unused exports and split lazy() pages into their own chunks
  const callerSupportsEsm = Boolean(api?.caller?.(caller => caller?.supportsStaticESM));
  const modules = NODE_ENV === 'esm' || callerSupportsEsm ? false : 'commonjs';

  if (api) {
    api.cache(() => NODE_ENV);
  }

  return {
    presets: [
      ['@babel/preset-env', { modules, loose: true }],
      ['@babel/preset-react', { development: dev, runtime: 'automatic' }],
      '@babel/typescript'
    ],
    plugins: [
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-export-namespace-from',
      '@babel/plugin-proposal-export-default-from',
      ['@babel/plugin-transform-runtime', { useESModules: !modules }],
      ['module-resolver', { alias: { '@': './src' } }]
    ]
  };
};
