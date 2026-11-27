# RFC: Route and loader discovery

Status: proposed. The Vite plugin generates route definitions using the existing `createRoute`, `createLoader`, and `useLoader` APIs.

## Application API

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import router from '@kitbag/router/vite'

export default defineConfig({
  plugins: [router(), vue()],
})
```

The default export of `@kitbag/router/vite` is documented as `router`. Compiler and generation interfaces are internal. The runtime package entry does not import build tooling.

| Option | Default | Behavior |
| --- | --- | --- |
| `routes` | `['**/*.route{,s}.ts']` | Source modules to collect; explicit values replace the defaults |
| `output` | `'src/routes.generated.ts'` | Aggregate module path; `false` disables the aggregate |

Paths are relative to Vite's root. `.route.ts` and `.routes.ts` behave identically: collect exported routes. `route.ts` and `routes.ts` do not match these suffixes. Explicit inputs may also export route arrays, preserving their order. A bare route definition passed only to `createRouter` is not a plugin input.

For an existing explicit registry:

```ts
router({ routes: ['src/registry.ts'] })
```

This generates `src/registry.generated.ts` alongside the source.

### Output

The `output` option controls the file that collects all discovered routes into an exported `routes` array. It defaults to `src/routes.generated.ts`, relative to Vite's root.

```ts
router({ output: 'src/app-routes.generated.ts' })
```

Set `output: false` to skip this collection file and import the generated route modules directly. Each source module still gets its generated counterpart.

```ts
router({
  routes: ['src/routes.ts'],
  output: false,
})
```

This generates `src/routes.generated.ts` from the explicit registry.

## Route definitions

```ts
// src/pages/home.route.ts
import { createRoute } from '@kitbag/router'
import HomePage from './HomePage.vue'

export const home = createRoute({
  name: 'home',
  path: '/',
})
  .addView(HomePage)
```

Both file types can export multiple routes. Only exported routes are registered.

## Component loaders

```ts
// src/components/countries.ts
import { createLoader } from '@kitbag/router'
import { getCountries } from '@/api/countries'

export const countries = createLoader({
  load: (_route, { signal }) => getCountries({ signal }),
  prefetch: 'intent',
})
```

```vue
<!-- src/components/CountrySelect.vue -->
<script setup lang="ts">
import { useLoader } from '@kitbag/router'
import { countries } from './countries'

const selectedCountry = defineModel<string>()
const { data: options } = await useLoader(countries)
</script>

<template>
  <select v-model="selectedCountry">
    <option v-for="country in options" :key="country.code" :value="country.code">
      {{ country.name }}
    </option>
  </select>
</template>
```

Automatic registration applies only to `useLoader(loaderDefinition)`. Calls such as `useLoader(route.loaders.name)` use an already registered loader and do not trigger discovery. The plugin follows supported component relationships from route views, associates those definitions with consuming routes, and generates ordinary `.addLoader()` calls. A component can be used by multiple routes.

If a loader cannot be registered automatically, the plugin warns and it loads during component setup.

## Attachment and generation

The plugin generates a file beside each route module: `home.route.ts` produces `home.route.generated.ts`. Source files remain unchanged.

Generated routes include discovered loaders and preserve existing loader registrations. Automatically registered loaders use their exported names.

Import the generated routes when creating the router:

```ts
// src/router.ts
import { createRouter } from '@kitbag/router'
import { routes } from './routes.generated'

export const router = createRouter(routes)
```

The aggregate collects discovered exports in deterministic file/export order; explicit arrays preserve their order. Existing registry exports are retained by their generated counterparts. Automatic discovery and explicit inputs may be combined, with duplicate registrations left to the runtime.

Generated modules stay on disk after the server stops. Their types follow ordinary route construction. Generation runs before Vite builds and on development startup; source changes, additions, and removals regenerate output and initially trigger a full reload. Files ending in `.generated.ts` are excluded from discovery and may be gitignored. Unchanged output is not rewritten. Stale outputs owned by a generation run are removed.

## Generate command

Run `router generate` to generate files without starting a server or building the application. It uses the project's Vite config, including the router plugin options and aliases.

```json
{
  "scripts": {
    "routes:generate": "router generate",
    "typecheck": "npm run routes:generate && vue-tsc --noEmit"
  }
}
```

A custom Vite config can be selected with `router generate --config path/to/vite.config.ts`.

## Delivery stack

1. Update this RFC around the existing loader runtime and file discovery.
2. Add the internal parser and dependency graph with discovery fixtures.
3. Generate augmented route definitions with readable input/output fixtures.
4. Collect route inputs and write persistent counterparts and aggregate output.
5. Publish the Vite adapter with build/startup generation and development regeneration.
6. Add a playground demonstrating explicit and discovered routes, nested and shared loaders, parent inheritance, and fallback diagnostics.

SFC macros remain a possible later convenience. The initial implementation uses ordinary TypeScript definitions and `useLoader`; it does not add runtime APIs or public compiler exports.
