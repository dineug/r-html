import { readFileSync } from 'node:fs';

import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import filesize from 'rollup-plugin-filesize';
import typescript from 'rollup-plugin-typescript2';
import ttypescript from 'ttypescript';

const pkg = JSON.parse(readFileSync('package.json', { encoding: 'utf8' }));

const banner = `/*!
 * ${pkg.name}
 * @version ${pkg.version} | ${new Date().toDateString()}
 * @author ${pkg.author}
 * @license ${pkg.license}
 */`;

export default {
  input: 'src/index.ts',
  context: 'globalThis',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      banner,
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    json(),
    typescript({
      typescript: ttypescript,
      useTsconfigDeclarationDir: true,
      importHelpers: false,
      check: false,
    }),
    filesize({
      showBrotliSize: true,
    }),
  ],
  external: ['@babel/core'],
};
