import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const config = [
  {
    input: 'test-data/save.js',
    output: {
      esModule: true,
      file: 'dist/test-data/save.js',
      format: 'es',
      sourcemap: false
    },
    plugins: [ json(), commonjs(), nodeResolve({ preferBuiltins: true }) ]
  },
  {
    input: 'test-data/restore.js',
    output: {
      esModule: true,
      file: 'dist/test-data/restore.js',
      format: 'es',
      sourcemap: false
    },
    plugins: [ json(), commonjs(), nodeResolve({ preferBuiltins: true }) ]
  }
];

export default config
