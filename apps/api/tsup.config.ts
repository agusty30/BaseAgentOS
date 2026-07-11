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
})
