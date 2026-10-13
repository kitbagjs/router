# Loader discovery proof of concept

An optional Vite plugin discovers loaders in nested Vue components and assembles ordinary `createRoute` definitions in persistent TypeScript files. The router core is unchanged. This example does not implement `defineRoute`.

From the repository root:

```sh
npm ci
npm run poc:dev
```

Start on Home, hover or focus Checkout, then click it. The timeline shows the router starting the countries request before the nested component consumes its promise. Checkout renders two selects sharing one result. Profile uses the same loader definition on another route. Expand the generated-code panel to inspect ownership and assembly.

## Persistent generated files

```text
routes.ts                                    authored definitions, never rewritten
router.ts                                    imports the generated registry
components/CountrySelect.vue                 authored loader declaration
.kitbag/routes.generated.ts                  completed, inferred route exports
.kitbag/loaders/components/CountrySelect.ts   extracted, typed callbacks
.kitbag/manifest.generated.ts                 inspectable ownership information
```

`.kitbag/` is gitignored. Generate it without starting Vite:

```sh
npm run poc:generate
```

The router imports the completed registry:

```ts
import { createRouter } from '@kitbag/router'
import { routes } from './.kitbag/routes.generated'

export const router = createRouter(routes)
```

Other code can import individual completed route exports from the same generated module. Imports from the original `routes.ts` refer to its original definitions and do not include discovered loaders. Keep router creation outside the authored route-definition module so generation does not copy an additional router instance.

Generated modules remain after the server stops. They contain real TypeScript imports and `.addLoader()` calls; their loader types come from those expressions, rather than ambient declarations describing an invisible registration. The standalone generation command also supports a clean checkout and CI.

## Authoring

Routes still use normal APIs:

```ts
export const checkout = createRoute({ name: 'checkout', path: '/checkout' })
  .addLoader(() => 'Manual loaders still work', { name: 'manual' })
  .addView(defineAsyncComponent(() => import('./pages/CheckoutPage.vue')))
```

Declare loaders in the normal script, and await their promises separately in setup:

```vue
<script lang="ts">
import { defineLoader } from 'virtual:kitbag-loader-macros'
import { getCountries } from '../api'

export const countries = defineLoader(() => getCountries(), { prefetch: 'intent' })
</script>

<script setup lang="ts">
const options = await countries
</script>
```

The generated route receives a loader named `countries`. Existing route code consequently has typed access to `route.data.countries`, including the return type of `getCountries`. Export names must be unique within a matched route chain; distinct definitions with the same name, or conflicts with manual loader names, produce diagnostics. Multiple instances of the same component share one registration.

`defineLoader` declares a callback rather than fetching data at module evaluation. The Vite adapter binds a per-navigation promise inside setup. Await behavior stays the same as awaiting `route.data` today, including its existing behavior when a component instance is reused. Prefetch scheduling and adoption remain Kitbag's existing behavior: a router-link click adopts its prefetched store; a separate programmatic push does not automatically adopt that link's store.

## Existing tools and responsibilities

- `@vue/compiler-sfc` parses script blocks and template component references.
- `ts-morph` handles script/route navigation, generated imports, callback extraction, and TypeScript formatting. Its project operates in memory; only explicit generated output paths are written to disk.
- `magic-string` handles the small SFC setup-binding edit with source maps.
- `generator.mjs` is independent of Vite. `plugin.mjs` is the adapter that supplies Vite resolution, regeneration, and setup transforms.

The generator reads configured route files, follows static component references through templates, emits callback modules, and writes augmented copies of the route-definition modules. It finalizes parents before children, so shared ancestor loaders are inherited instead of registered twice. Relative imports are relocated to the generated modules and lazy page imports remain lazy.

Files are atomically replaced only when their contents change, avoiding unnecessary watcher activity. Regeneration removes stale loader modules bearing the generator's marker. Route/SFC edits rescan the graph, invalidate module caches, and reload the page. This is conservative reload behavior, not mutation of an installed router registry.

## Supported boundary

- Explicit `routeFiles`, with top-level `createRoute` chains and inline options.
- Default SFC imports passed to `.addView()`, or a single inline lazy SFC import.
- Static default SFC imports referenced in templates, including transitive descendants and kebab-case tags. Conditional static components contribute loaders even when not rendered.
- Earlier parent route declarations in the same module.
- A normal script containing imports and individual exported `const defineLoader(...)` declarations, plus a setup script.
- Inline loader callbacks with no parameters. No props or setup-local values are available. Loader context and inferred route params are not implemented.
- Optional loader prefetch configuration. Local result types are supplied by `macros.d.ts`; generated registry types require no running server or additional editor extension.

Dynamic components, globally registered/auto-imported components, externally supplied slots, named component imports, imported parents, helper-built routes, arbitrary route construction, and dependencies between loader declarations are outside this prototype. The standalone resolver supports relative SFC imports; Vite supplies its resolver while running the plugin. Keep imports in generated route-definition modules directed toward definitions/helpers, not their router consumer, to avoid initialization cycles.

The promise accessor uses the default router injection key. Independent router keys and SSR hydration are not verified. A loader component used outside a registered route throws a diagnostic. Cross-file imports of SFC loader exports as data promises are not supported. Extracted callback source maps and production-grade editor diagnostics remain future work.

## Validation

```sh
npm run poc:test
npm run poc:types    # generates first, then checks types
npm run poc:build
```

To check the persisted files without generation or a server:

```sh
npx vue-tsc --noEmit -p examples/loader-discovery/tsconfig.json
```

Tests cover discovery, deduplication, promise sharing, manual-loader coexistence, request timing, settled/in-flight prefetch adoption, parent inheritance, generated loader types, compiled SFC scopes, unsupported syntax, and regeneration after loader edits/additions/removals. The update test verifies authored route source is unchanged and generated modules survive server shutdown. The build emits separate page/component chunks.
