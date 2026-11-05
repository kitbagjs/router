# Route and loader discovery

The optional Vite plugin collects exported routes and attaches reusable loaders used by their components. Components consume loaders through the existing [`useLoader`](/composables/useLoader) API.

## Configure Vite

Add the plugin before Vue:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import router from '@kitbag/router/vite'

export default defineConfig({
  plugins: [router(), vue()],
})
```

By default, `routes` is `['**/*.route{,s}.ts']`, matching `.route.ts` and `.routes.ts` modules anywhere under Vite's root. Both suffixes behave identically. Bare `route.ts` and `routes.ts` filenames are not discovered automatically. The plugin collects named and default route exports, including reexports. Exported route arrays are also supported and preserve their order.

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

The plugin writes `home.route.generated.ts` alongside the source and collects discovered routes in `src/routes.generated.ts`. Import the aggregate when creating the router:

```ts
import { createRouter } from '@kitbag/router'
import { routes } from './routes.generated'

export const router = createRouter(routes)
```

Only exported definitions become registration roots. Private parents can still be used by exported child routes. Repeated registrations remain repeated; existing router duplicate-name checks apply.

## Component loaders

Define reusable loaders in ordinary TypeScript modules. Loader filenames are unrestricted. See [reusable loaders](/core-concepts/loaders#reusable-loaders) for their options and [context](/advanced-concepts/context) for referencing routes and rejections.

```ts
// src/components/countries.ts
import { createLoader } from '@kitbag/router'
import { getCountries } from '@/api/countries'

export const countries = createLoader({
  load: (_route, { signal }) => getCountries({ signal }),
  prefetch: 'intent',
})
```

If your globally registered router includes these loaders, TypeScript may encounter circular inference: the loader factory is typed from the router, which is inferred from its loaders. An explicit `Loader<ReturnType<typeof getCountries>>` annotation on `countries` breaks that cycle while preserving the API function's result type. Use `Loader<Promise<Result>>` when the load callback is asynchronous.

A component's `useLoader` call establishes its dependency:

```vue
<script setup lang="ts">
import { useLoader } from '@kitbag/router'
import { countries } from './countries'

const { data: options } = await useLoader(countries)
</script>

<template>
  <select>
    <option v-for="country in options" :key="country.code" :value="country.code">
      {{ country.name }}
    </option>
  </select>
</template>
```

The plugin follows statically imported components referenced in templates, including nested components, lazy views, and reusable `createView` definitions. It follows loader calls in directly called imported composable modules too. Such modules are scanned conservatively: their loader calls represent potential dependencies. Conditional component branches also contribute their loaders before rendering.

Imported aliases, namespace API imports, loader reexports, and `useLoader` exported from `createRouterAssets` are supported. An unused loader import does not cause attachment. Auto-imported APIs, runtime-selected components, render functions, and dependencies hidden behind dynamic imports or opaque factories require explicit registration.

Automatically attached loaders use the definition's export name. A unique existing attachment, including an inherited attachment, is reused with its existing options. Name conflicts or multiple explicit attachments produce diagnostics; select a specific attachment through `useLoader(route.loaders.name)` when necessary.

Setup-local loaders and SFC-local definitions requiring extraction are skipped with a diagnostic. Their existing runtime fallback behavior remains available. Move a reusable definition into an exported TypeScript module to make it discoverable before component setup. Generated modules import that original definition so its identity is preserved. Static `context` arrays on routes and reusable definitions are connected to the generated routes too. Context arrays may use exported constants and spreads; runtime-computed context requires explicit configuration outside discovery.

## Explicit registries

Set `routes` to replace the default discovery patterns. Set `output: false` to consume a generated counterpart directly:

```ts
router({
  routes: ['src/routes.ts'],
  output: false,
})
```

An explicit `src/routes.ts` registry then produces `src/routes.generated.ts`. To also create an aggregate, choose a different output path:

```ts
router({
  routes: ['src/routes.ts', 'src/features/**/*.route.ts'],
  output: 'src/all-routes.generated.ts',
})
```

Explicit patterns are processed in configured order, with sorted matches inside each pattern. Default discovery sorts all matching files. Configured paths are relative to Vite's root and use its aliases for resolving dependencies. Choose non-overlapping registrations when mixing registries and discovery.

## Generated files

Generated siblings and the aggregate are persistent TypeScript modules. The aggregate path must end in `.generated.ts`. Source files are unchanged, while generated output paths may be overwritten. Add `**/*.generated.ts` to your gitignore and lint exclusions.

The plugin generates on development startup and before builds. It regenerates on source changes, additions, and removals, then reloads the application. Unchanged files retain their timestamps. Stale files marked as owned by this generator are removed, including after restarting Vite. Configure one plugin instance per project.

Generated definitions preserve route construction, including augmenting parents before children. Keep shared loaders and params in separate modules or export their definitions: private module-scope calls cannot safely be duplicated when a generated module also needs to import original shared values. Unsupported construction should be made explicit rather than relying on runtime factories that the parser cannot inspect.

## Generate without a build

Run `router generate` to write the generated files and exit. The command reads your Vite config, including the router plugin options and aliases, without starting a server or building the application.

```json
{
  "scripts": {
    "routes:generate": "router generate",
    "typecheck": "npm run routes:generate && vue-tsc --noEmit"
  }
}
```

Use `--config` for a custom Vite config, `--root` for a different project root, or `--mode` to select a Vite mode. The default mode is `development`.

```sh
router generate --config examples/playground/vite.config.ts
```
