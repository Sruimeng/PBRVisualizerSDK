import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 8080,
    strictPort: false,
    open: '/demo/index.html',
  },
  preview: {
    host: '0.0.0.0',
    port: 8080,
    strictPort: false,
    open: '/demo/index.html',
  },
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
      outDir: 'dist/types'
    }),
    viteStaticCopy({
      targets: [
        { src: 'ai_studio_code.html', dest: '.' },
        { src: 'gl.html', dest: '.' },
        { src: 'demo/**', dest: 'demo' }
      ]
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@sruim/pbr-visualizer-sdk': resolve(__dirname, 'src/index.ts')
    },
    dedupe: ['three']
  },
  optimizeDeps: {
    include: ['three', 'postprocessing']
  }
});
