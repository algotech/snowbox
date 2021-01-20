import babel from 'rollup-plugin-babel';
import filesize from 'rollup-plugin-filesize';
import { terser } from 'rollup-plugin-terser';

import { name } from './package.json';

const isProduction = process.env.NODE_ENV === 'production';

const destBase = `dist/${name}`;
const destExtension = `${isProduction ? '.min' : ''}.js`;

export default {
  input: 'src/index.js',
  output: [
    { file: `${destBase}${destExtension}`, format: 'cjs' },
    { file: `${destBase}.es${destExtension}`, format: 'es' },
    { file: `${destBase}.umd${destExtension}`, format: 'umd', name },
    { file: `${destBase}.amd${destExtension}`, format: 'amd', name },
    { file: `${destBase}.browser${destExtension}`, format: 'iife', name },
  ],
  plugins: [babel({}), isProduction && terser(), filesize()].filter(Boolean),
};
