# RFC: Component route and loader discovery

Status: proposed. This RFC defines the API and delivery structure; it does not implement or publish the APIs below.

## Purpose

Let users colocate route and loader definitions with components, either in dedicated files or a normal SFC script block. Tooling collects definitions and their component relationships into ordinary Kitbag routes before router creation. Applications import one generated registry rather than maintaining a central web of route imports. Components consume the current route and loader promises in script setup.

Users can keep their existing `createRoute` definitions and introduce component loaders incrementally. File-based discovery is a primary entry point; SFC `defineRoute` and `defineLoader` declarations are optional colocation syntax over the same internal model. The implementation must not require SFC macros to discover a route module or associate a file-defined loader with a component.

The router keeps its existing loading, prefetching, and navigation behavior. The additional abstraction is discovery, generation, and binding the declarations to component setup.

## Delivery stack

| PR | Scope | Depends on |
| --- | --- | --- |
| 1 | This RFC: public API, internal compiler structure, generated output, and behavior contracts | `main` |
| 2 | Vite adapter and standalone parser/generator, with an internal macro registration interface | PR 1 |
| 3 | Loader discovery: file declarations and `defineLoader`, component association, promise binding, generated data types | PR 2 |
| 4 | Route discovery: file declarations and `defineRoute`, view association, setup binding, colocated loader inference | PR 3 |
| 5 | Playground demonstrating manual routes, colocated routes, nested loaders, and regeneration | PR 4 |

Each implementation PR builds on the previous branch. The playground is a consumer of the tooling, not its implementation location. The earlier [loader discovery prototype](https://github.com/kitbagjs/router/pull/940) is a reference for the design, not the base of this stack.

## Package API

| Entry point | Proposed exports | Audience |
| --- | --- | --- |
| `@kitbag/router` | `defineLoader`, `defineRoute`, and their public types, alongside existing APIs | Application components |
| `@kitbag/router/vite` | Default export, documented as `router` | Vite configuration |

Application macros are root exports. They have type signatures and missing-tooling diagnostics; invoking an untransformed macro does not register a route or start a request.

The Vite entry point is build-time code. The compiler, generator, macro registrations, and their types are internal implementation details; there is no public compiler entry point or custom macro API. Importing the runtime entry point must not import filesystem access, parsers, or generation dependencies. The implementation PR will determine the dependency packaging needed to maintain that boundary.

## Configure tooling

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import router from '@kitbag/router/vite'

export default defineConfig({
  plugins: [router(), vue()],
})
```

The plugin accepts optional configuration. Paths are relative to Vite's resolved project root.

| Option | Default |
| --- | --- |
| `routeFiles` | `['src/routes.ts', 'src/**/*.route.ts', 'src/**/*.routes.ts', 'src/routes/**/*.ts']` |
| `loaderFiles` | `['src/**/*.loader.ts', 'src/**/*.loaders.ts']` |
| `routeComponents` | `['src/**/*.vue']` |
| `outputDir` | `'src/.kitbag'` |

`routeFiles` discovers authored route modules whose exported `routes` arrays should be included. This supports a single registry, feature-colocated modules such as `src/features/billing/billing.routes.ts`, single-route modules such as `src/pages/home.route.ts` beside `src/pages/home.vue`, and a dedicated routes directory. These conventions identify registration modules, not URL paths; paths remain explicit in route definitions.

Each matched route module exports a `routes` array using the existing route API. Its array order is preserved. Declaration files, tests/specs, generated output, dependencies, and build output are excluded from discovery. A matched source module without a supported `routes` export produces a diagnostic; helper modules should live outside the route-module patterns.

Files matched by overlapping patterns are included once. Default discovery orders `src/routes.ts` first, then the remaining modules by normalized project-relative path. If routes from different registries have ambiguous precedence, applications should use a single ordered registry or configure explicit `routeFiles`. Registering the same route through multiple module registries produces a diagnostic; discovery must not silently register it twice.

An explicit `routeFiles` value replaces the defaults. Patterns are processed in configured order, matches within each pattern are sorted, and the first occurrence of each file determines its position. `routeFiles: []` disables manual route discovery for macro-only projects. Missing default files and empty default patterns are allowed; explicitly configured paths or patterns with no matches produce diagnostics.

`routeComponents` identifies SFCs to scan for route declarations. Scanning all source SFCs registers only explicit `defineRoute` declarations; filenames do not imply routes. A component with a loader but no route is discovered through the views of a registered route; it does not become a route on its own. `routeComponents: []` disables macro route discovery while preserving loaders reachable from manual route views.

`outputDir` holds persistent, generated TypeScript. The directory is gitignored and excluded from source discovery. Generation must not edit authored route or component files. Adding, renaming, or deleting a matching source module must refresh the generated registry during development.

For a different project layout or explicit registration order:

```ts
router({
  routeFiles: ['app/routes.ts', 'app/features/**/*.routes.ts'],
  routeComponents: ['app/**/*.vue'],
  outputDir: 'app/.kitbag',
})
```

## File declarations and component association

Dedicated `.route.ts` / `.routes.ts` and `.loader.ts` / `.loaders.ts` files are first-class declaration sources. Their definitions and SFC declarations feed the same internal representation; route assembly, prefetching, deduplication, and generated typing must not depend on how a definition was authored.

```text
src/pages/
  home.route.ts
  home.vue
src/components/
  CountrySelect.vue
  countries.loader.ts
```

Route modules use existing `createRoute` definitions and are collected automatically. Loader modules define callbacks and loader configuration without starting requests at module import. A singular file can hold one definition; plural files can group definitions. The precise loader export shape and singular-route export convenience are decisions to settle before implementation, not a commitment to a new runtime factory.

`loaderFiles` identifies loader-definition modules. Explicit values replace the defaults; `[]` disables file-loader discovery. The same source exclusions and stable file identities used for route discovery apply. Finding a loader definition does not register it on every route.

A component associates itself with a file-defined loader by importing and consuming its exported binding. For example, `CountrySelect.vue` imports the countries definition from `countries.loader.ts` and awaits the current navigation's countries promise in setup. This is one local dependency, not a requirement to import and assemble loaders in `routes.ts` or at `createRouter`.

An SFC-local `defineLoader` associates its declaration directly with that component. Both forms create the same component-to-loader relationship. The compiler follows statically supported component imports and template usage from registered route views, then attaches each component's loaders to its consuming routes. Imports used only for types or unrelated utilities must not create loader relationships. Supported reexports and aliases must retain the original declaration identity.

For example, `CheckoutPage.vue` renders `AddressForm.vue`, which renders `CountrySelect.vue`. The countries loader is added to checkout. If `ProfilePage.vue` also renders `CountrySelect.vue`, the same definition contributes to profile. The loader remains route-agnostic; using it beneath either route does not grant it that route's params or accept component props.

Filenames classify declaration modules; a name such as `activeUser.loader.ts` need not match the consuming component's name. Import usage supplies that relationship. Automatic same-basename companion attachment is not required for generic loaders. Whether `home.route.ts` may infer `home.vue` as its view remains a separate route convenience to settle; explicit `.addView()` works with the existing API.

An imported loader definition is not a process-global data promise. The component's consumption binding must resolve to the existing router-managed promise for its navigation, with setup awaiting it as usual. Both the component transform and editor/`vue-tsc` typing must support that contract; file discovery alone is insufficient. Outside a supported component consumption site, the export remains a definition. Exact binding syntax and its type projection are decisions for PR 3.

A future `createLoader` could provide an explicitly reusable loader definition with a context contract similar to `createRoute`. It is deferred: no `createLoader` export or new context behavior is part of this stack. File discovery and component association should not depend on adding that API.

## `defineLoader` in an ordinary component

```vue
<!-- components/CountrySelect.vue -->
<script lang="ts">
import { defineLoader } from '@kitbag/router'
import { getCountries } from '@/api/countries'

export const countries = defineLoader(
  () => getCountries(),
  { prefetch: 'intent' },
)
</script>

<script setup lang="ts">
const selectedCountry = defineModel<string>()
const options = await countries
</script>

<template>
  <select v-model="selectedCountry">
    <option v-for="country in options" :key="country.code" :value="country.code">
      {{ country.name }}
    </option>
  </select>
</template>
```

`defineLoader(load, options?)` declares a callback. The declaration is not awaited. The binding consumed by the same component's setup is `Promise<Awaited<ReturnType<typeof load>>>`; setup awaits that promise separately.

Options carry the existing loader configuration, including `prefetch` and applicable payload transformer options. The export name supplies the default route data key. An explicit `name` option can override that key. Multiple loader declarations are allowed.

Ordinary component loaders are route-agnostic: they do not acquire a particular route's params or parent-data types because a route happens to render them. They can fetch general application data through imports or application services. The declaration has no component-instance input: props and setup-local state cannot be captured or passed into it.

A callback can omit its arguments. Any callback context exposed without a colocated route must not pretend that a particular consuming route is guaranteed. An optional `context` field, analogous to route context, is reserved for design in PR 3. Listing routes in that context must not be treated as supplying a current organization ID or other param. Its exact capabilities and types remain an explicit decision.

## Keep existing route definitions

```ts
// src/routes.ts
import { createRoute } from '@kitbag/router'
import { defineAsyncComponent } from 'vue'

export const checkout = createRoute({
  name: 'checkout',
  path: '/checkout',
})
  .addLoader(() => getCheckoutSummary(), { name: 'summary' })
  .addView(defineAsyncComponent(() => import('./pages/CheckoutPage.vue')))

export const routes = [checkout] as const

function getCheckoutSummary() {
  return { title: 'Your order' }
}
```

If `CheckoutPage` renders `AddressForm`, which renders `CountrySelect`, the countries loader is collected into the checkout route. Manual and discovered loaders coexist. The completed route's data contains typed `summary` and `countries` promises.

The initial discovery contract covers statically imported SFCs referenced in templates, including transitive descendants and lazy route views. It is a static data-requirement graph. A conditionally rendered child still contributes its loader even if the branch is not displayed for a navigation.

A component reused by unrelated routes contributes its loader to each. Multiple instances, repeated graph paths, and multiple views using the same loader definition do not register it repeatedly in a matched route chain. If a parent already owns the definition, children inherit it at that parent's match depth.

Distinct declarations using the same data key, including conflicts with manual loaders, are errors rather than silent overrides. Dynamic components, global component registration, auto-import resolvers, and externally supplied slots need explicit integration or an escape hatch. The initial implementation must document what it can discover and reject unsupported route construction where it can detect it.

Discovery must make loader functions available for prefetching without loading the UI component module to discover them.

## `defineRoute` and colocated loader inference

```vue
<!-- pages/OrganizationPage.vue -->
<script lang="ts">
import { defineRoute, defineLoader } from '@kitbag/router'
import { getOrganization } from '@/api/organizations'

export const route = defineRoute({
  name: 'organization',
  path: '/organizations/[organizationId]',
})

export const organization = defineLoader((to, { signal }) => {
  // to.params.organizationId is inferred as string
  return getOrganization(to.params.organizationId, { signal })
})
</script>

<script setup lang="ts">
import { computed } from 'vue'

const organizationId = computed(() => route.params.organizationId)
const data = await organization
</script>

<template>
  <h1>{{ data.name }}</h1>
  <p>{{ organizationId }}</p>
</template>
```

`defineRoute(options, viewOptions?)` declares a route using existing route options. The declaring SFC is attached automatically as its view; the optional second argument supplies view configuration such as a props getter or a named view. Deprecated `component` and `components` fields are not part of this macro API.

There is at most one route declaration per SFC. Paths remain explicit; discovering an SFC does not imply filename-based URLs. Names follow the existing route API, with a generated internal identity available when a navigable macro route omits its name. The naming rule must be stable and documented.

In setup, the `route` binding is the current reactive route, with narrowing equivalent to `useRoute` for the declared route, including descendants where that route is an ancestor match. The author does not repeat its name or call `useRoute`. Existing param update/reactivity behavior is preserved.

A colocated route supplies loader callback types equivalent to declaring `.addLoader()` on that route. This includes schema-derived and inherited params, route context, abort signal, and parent data. It retains the existing restriction against reading the loader's own route data or depending on sibling loader promises.

This relationship must exist in editor diagnostics and `vue-tsc`, not just the generated build. Standalone function signatures cannot infer a sibling declaration automatically; PRs 2 and 4 must provide a type projection or language-tooling integration for that relationship. Explicit annotations cannot be the only way to obtain the advertised inference.

An ordinary component reused by several routes does not inherit this contextual inference implicitly. It remains route-agnostic unless it has its own route declaration or an explicitly supported context contract.

## Definition scope and setup scope

| Authored binding | Declaration/export role | Same-file setup role |
| --- | --- | --- |
| `export const data = defineLoader(...)` | Loader definition available for collection | Promise belonging to the current navigation |
| `export const route = defineRoute(...)` | Route definition available for registration | Current reactive route narrowed to the declaration |

The separate scripts are a deliberate boundary. Kitbag declarations live in the normal script; consuming them lives in script setup. Kitbag macro calls inside setup are outside this proposal.

Neither binding is a process-global live route or a module-global data promise. Component binding uses the appropriate router and navigation. Independent router keys and concurrent SSR requests must not share results accidentally. The implementation must expose any configuration needed to select the correct router assets.

Other modules should import completed route definitions from generated exports. Treating an SFC's loader export as a data promise in an unrelated module is not supported by this proposal. The generated callback is a definition; data consumption remains instance/navigation scoped.

## Generated API

```ts
// src/router.ts
import { createRouter } from '@kitbag/router'
import { routes } from './.kitbag/routes.generated'

export const router = createRouter(routes)
```

`routes.generated.ts` exports the completed registry as an inferred readonly tuple and individual completed route definitions. It combines discovered route modules, explicitly registered manual routes, and SFC route declarations, augmented with their reachable loaders. Generated callback modules are `.ts` files too; they preserve the result types of the loader code and its imports.

Generated code uses ordinary `createRoute`, `.addLoader`, and `.addView` calls. Their construction executes at application runtime. Discovery and module extraction occur ahead of time; the router does not inspect component source or run a component instance to discover data requirements.

Generated parent definitions must be finalized before children inherit their matches. This is required by immutable route chaining and existing parent snapshots. Assembly cannot simply append every discovered loader to each leaf route after the hierarchy is constructed.

Imports from original route modules still have their original types. Consumers needing discovered data types must use the completed generated exports. The generator must keep definition modules independent from router-consumer modules so assembly does not create initialization cycles or duplicate router instances.

Generated files remain available when Vite stops. A clean checkout needs generation before typechecking/building. Writes should be deterministic, replace only changed output, and remove stale generator-owned artifacts. A malformed declaration must report its source location rather than silently generate an incomplete registry.

Loader data remains a promise. There is no resolved ref adapter, `.value` API, new loading-state abstraction, cross-navigation cache, or change to setup-await behavior in this proposal. Existing prefetch scheduling and store adoption remain in Kitbag.

## Generation engine

The Vite adapter uses an internal parser/generator shared with standalone generation fixtures and repository tooling. Neither the generator nor its types are package exports. A public standalone generation command is outside this API proposal; generation before a clean-checkout typecheck remains a workflow requirement to address in the implementation.

Resolution rules must agree between development and standalone generation, including aliases supported by the implementation. The Vite adapter adds watching, invalidation, and component transforms. The initial development behavior may regenerate and reload; replacing an already installed router's registry in place is not required.

## Adding macros

The parser/generator is a reusable layer delivered before either built-in macro. Recognizing `defineLoader` or `defineRoute` must be implemented through macro registrations, not special names embedded throughout the parser.

Macro registration is internal. Users cannot supply custom macros, and the Vite plugin has no `macros` option. The architecture lets library maintainers add built-in macros without coupling every parser stage to their names.

The exact internal artifact record types are to be defined in PR 2, before `defineLoader` needs them. The internal contract must cover:

- Recognition by import source and exported name, including local aliases and shadowing checks.
- A parsed declaration with file location, binding identity, arguments, and dependencies.
- Contributions to generated modules, route definitions/extensions, and the discovery graph.
- Setup-binding transformations and matching type projections where a macro has a component-consumption role.
- Stable artifact identities, ordering/dependency relationships, source maps, and source diagnostics.

The shared engine owns traversal, import relocation, output writes, and dependency invalidation. Handlers contribute declarations/artifacts through the shared context and do not edit authored files or independently write generated files. Adding a new macro handler should not require rewriting the Vite adapter or duplicating the parser.

An internal handler can use only the stages it needs; a declaration-only macro does not need a setup binding. Applications configure the Vite plugin and use the supported built-ins.

## Decisions for implementation

- Settle file-loader export/configuration and imported consumption syntax, singular-route export conventions, and optional same-basename route/view association.
- Settle loader context capabilities without implying route-param or component-prop input in a route-agnostic loader.
- Choose the stable identity/name rule for unnamed macro routes and generated route export naming across modules.
- Define internal macro artifact and type-projection interfaces in PR 2; demonstrate registration with a small compiler fixture before adding the built-ins.
- Specify component discovery escape hatches and integrations for unresolved component relationships.
- Decide how generated route references and external parents/context are represented without creating import cycles.
- Specify router-key selection, SSR isolation/hydration, and the Vue language-tools integration required for colocated inference.

These are implementation decisions within the proposed structure, rather than reasons to silently change its consumption syntax. The stack should keep this RFC updated when an API decision changes.
