import { defineConfig, type Connect, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { createRequire } from "module";
import type { IncomingMessage, ServerResponse } from "http";

const require = createRequire(import.meta.url);
const FN_NAME_RE = /^[a-zA-Z0-9_-]+$/;

function netlifyFunctionsPlugin() {
  return {
    name: 'netlify-functions-middleware',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
        try {
          if (!req.url || !req.url.startsWith('/.netlify/functions/')) return next();
          const url = new URL(req.url, 'http://localhost');
          const parts = url.pathname.split('/').filter(Boolean);
          const fnName = parts[parts.indexOf('functions') + 1];
          if (!fnName || !FN_NAME_RE.test(fnName)) return next();
          const fnPath = path.resolve(process.cwd(), 'netlify', 'functions', `${fnName}.js`);
          const raw = await new Promise<Buffer>((resolve) => {
            const chunks: Buffer[] = [];
            req.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
            req.on('end', () => resolve(Buffer.concat(chunks)));
            req.on('error', () => resolve(Buffer.alloc(0)));
          });
          const event = {
            httpMethod: req.method,
            headers: req.headers,
            queryStringParameters: Object.fromEntries(url.searchParams),
            body: raw && raw.length ? raw.toString() : undefined,
            rawBody: raw
          };
          delete require.cache[require.resolve(fnPath)];
          const mod = require(fnPath);
          const handler = mod.handler || mod.default || mod;
          const result = await handler(event);
          const statusCode = result?.statusCode ?? 200;
          const headers = result?.headers ?? { 'Content-Type': 'application/json' };
          res.writeHead(statusCode, headers);
          res.end(result?.body ?? '');
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if ((err as NodeJS.ErrnoException)?.code === 'MODULE_NOT_FOUND' || /Cannot find module/.test(message)) return next();
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: message }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: { overlay: false },
  },
  plugins: [
    react(),
    mode === "development" && netlifyFunctionsPlugin()
  ].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    sourcemap: false,
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion';
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'vendor-charts';
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase';
          if (id.includes('node_modules/@radix-ui')) return 'vendor-radix';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) return 'vendor-react';
          if (/node_modules\/react\//.test(id)) return 'vendor-react';
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
          // three.js + the force-graph stack it powers are the bulk of
          // AutomationGraph3D's ~1.3MB chunk. That chunk is already lazy
          // (route-split, and only fetched once a user clicks Automations'
          // "Preview" tab) so this split doesn't shrink first load — it
          // means a future code change to AutomationGraph3D.tsx itself
          // doesn't force re-downloading three.js too, since it stays
          // cached separately across deploys.
          if (id.includes('node_modules/three') || id.includes('node_modules/3d-force-graph')
            || id.includes('node_modules/react-force-graph-3d') || id.includes('node_modules/d3-force-3d')
            || id.includes('node_modules/react-kapsule')) return 'vendor-three';
        },
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));
