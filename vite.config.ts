import { defineConfig, type Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

// Server-only modules that should NEVER be in client bundle
const serverOnlyModules = [
  '@prisma/client',
  '@prisma/adapter-pg',
  'prisma',
  'pg',
  // better-auth server packages (not the /react client)
  'better-auth/adapters',
  'better-auth/tanstack-start',
]

// Paths that indicate server-only code
const serverOnlyPaths = [
  '.server.ts',
  '.server.js',
  '/prisma/src/generated/',
  '/db.server',
  '/auth.server',
]

// Plugin that returns empty module for server-only imports in client builds
function excludeServerModulesPlugin(): Plugin {
  return {
    name: 'exclude-server-modules',
    enforce: 'pre',
    resolveId(id, importer, options) {
      // Only intercept for client builds (not SSR)
      if (options?.ssr) return null
      
      // Check if this is a server-only npm module
      const isServerOnlyModule = serverOnlyModules.some(
        mod => id === mod || id.startsWith(`${mod}/`)
      )
      
      // Check if this is a server-only path (local files)
      const isServerOnlyPath = serverOnlyPaths.some(
        p => id.includes(p) || (importer && importer.includes(p))
      )
      
      if (isServerOnlyModule || isServerOnlyPath) {
        // Return a virtual module ID
        return `\0virtual:empty-${id.replace(/[/@]/g, '_')}`
      }
      return null
    },
    load(id) {
      // Provide empty module for virtual IDs
      if (id.startsWith('\0virtual:empty-')) {
        return 'export default {}; export const PrismaClient = class {}; export const prisma = {}; export const auth = {};'
      }
      return null
    },
  }
}

const config = defineConfig({
  plugins: [
    excludeServerModulesPlugin(),
    devtools(),
    nitro(),
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
  ssr: {
    external: serverOnlyModules,
  },
  optimizeDeps: {
    exclude: serverOnlyModules,
  },
})

export default config
