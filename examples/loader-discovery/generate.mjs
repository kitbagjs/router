import { fileURLToPath } from 'node:url'
import { createGenerator } from './generator.mjs'

const root = fileURLToPath(new URL('.', import.meta.url))
const { manifests } = await createGenerator({ root, routeFiles: ['routes.ts'] }).generate()
for (const entry of manifests) console.log(`Generated ${entry.output}`)
