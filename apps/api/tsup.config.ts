import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  dts: true,
  noExternal: [/^(?!argon2|pg-native).*/],
  external: ['argon2', 'pg-native'],
  platform: 'node',
  target: 'node20',
  clean: true,
  banner: {
    js: [
      "import { createRequire as __cr } from 'module';",
      "import { fileURLToPath as __fu } from 'url';",
      "import { dirname as __dn } from 'path';",
      "const require = __cr(import.meta.url);",
      "const __filename = __fu(import.meta.url);",
      "const __dirname = __dn(__filename);",
    ].join('\n'),
  },
})
