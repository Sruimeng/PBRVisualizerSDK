import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PBRVisualizer',
      fileName: (format) => `index.${format === 'es' ? 'mjs' : format === 'cjs' ? 'cjs' : 'js'}`
    },
    rollupOptions: {
      external: ['three', 'postprocessing', 'react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          three: 'THREE',
          postprocessing: 'POSTPROCESSING',
          react: 'React',
          'react-dom': 'ReactDOM'
        },
        exports: 'named'
      }
    },
    target: 'es2020',
    minify: 'terser',
    sourcemap: true
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outputDir: 'dist/types'
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@sruim/pbr-visualizer-sdk': resolve(__dirname, 'src/index.ts')
    }
  },
  optimizeDeps: {
    include: ['three', 'postprocessing']
  }
});
