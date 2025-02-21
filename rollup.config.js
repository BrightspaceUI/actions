import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const config = [
  {
    input: ['test-data/save.js', 'test-data/restore.js'],
    output: {
      esModule: true,
      dir: 'dist/test-data/',
      format: 'es',
      sourcemap: false
    },
    plugins: [ json(), commonjs(), nodeResolve({ preferBuiltins: true }) ]
  }
];

export default config
