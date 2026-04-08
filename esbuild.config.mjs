import * as esbuild from 'esbuild';
import { argv } from 'process';

const isWatch = argv.includes('--watch');
const isProduction = argv.includes('--production');

const ctx = await esbuild.context({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  format: 'cjs',
  minify: isProduction,
  sourcemap: !isProduction,
  sourcesContent: false,
  platform: 'node',
  outfile: 'dist/extension.js',
  external: ['vscode'],
  logLevel: 'silent'
});

if (isWatch) {
  await ctx.watch();
  console.log('[esbuild] watching...');
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log('[esbuild] build complete');
}
