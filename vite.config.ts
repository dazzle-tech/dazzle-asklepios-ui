import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/guide/rolldown
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';

  return {
    plugins: [
      // Using @vitejs/plugin-react v5+ which uses Oxc for React refresh (faster!)
      react()
    ],

    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), './src')
      }
    },

    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          math: 'parens-division'
        }
      }
    },

    build: {
      outDir: 'assets',
      sourcemap: env.GENERATE_SOURCEMAP !== 'false',
      minify: isProduction ? 'oxc' : false,
      rollupOptions: {
        output: {
          advancedChunks: {
            groups: [
              {
                name: 'vendor-react',
                test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/
              },
              { name: 'vendor-redux', test: /[\\/]node_modules[\\/](@reduxjs|redux)[\\/]/ },
              { name: 'vendor-rsuite', test: /[\\/]node_modules[\\/]rsuite[\\/]/ },
              { name: 'vendor-mui', test: /[\\/]node_modules[\\/]@mui[\\/]/ },
              { name: 'vendor-stimulsoft', test: /[\\/]node_modules[\\/]stimulsoft[\\/]/ }
            ]
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },

    server: {
      port: 3100,
      host: '0.0.0.0',
      open: false
    },

    preview: {
      port: 3100,
      host: '0.0.0.0'
    },

    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom']
      // exclude: ['stimulsoft-reports-js'], // Large libraries to exclude
    },

    experimental: {
      // Native plugins enabled by default in rolldown-vite
      enableNativePlugin: 'v1'
    }
  };
});
