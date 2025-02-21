import { nodeResolve } from '@rollup/plugin-node-resolve'

const config = [
  {
    input: 'test-data/save.js',
    output: {
      esModule: true,
      file: 'dist/test-data/save.js',
      format: 'es',
      sourcemap: false
    },
    plugins: [nodeResolve({ preferBuiltins: true })]
  },
  {
    input: 'test-data/restore.js',
    output: {
      esModule: true,
      file: 'dist/test-data/restore.js',
      format: 'es',
      sourcemap: false
    },
    plugins: [nodeResolve({ preferBuiltins: true })]
  }
];

export default config
