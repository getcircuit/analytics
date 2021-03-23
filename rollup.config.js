import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'

// List of extensions that can be automatically resolved
const RESOLVABLE_EXTS = ['.ts', '.tsx', '.js']

export default {
  input: 'src/index.ts',
  output: [
    {
      dir: 'esm/',
      format: 'esm',
      entryFileNames: '[name].js',
      sourcemap: true,
    },
    {
      dir: 'cjs/',
      format: 'cjs',
      sourcemap: true,
    },
  ],
  plugins: [
    resolve({ extensions: RESOLVABLE_EXTS }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      extensions: RESOLVABLE_EXTS,
    }),
  ],
}
