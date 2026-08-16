# @kitbag/router - Agent Guide

Type-safe router for Vue 3. Not a fork of vue-router — different API, different mental model.

Docs: https://kitbag.dev/router

## Install

```bash
npm install @kitbag/router
```

## 5 Canonical Patterns

### 1. Define routes with `createRoute` and `addView`

```ts
import { createRoute, withParams } from '@kitbag/router'
import Home from './views/Home.vue'
import User from './views/User.vue'

const home = createRoute({ name: 'home', path: '/' })
  .addView(Home)

const user = createRoute({
  name: 'user',
  path: withParams('/user/[userId]', { userId: Number }),
})
  .addView(User, {
    props: (route) => ({ id: route.params.userId }),
  })

const routes = [home, user] as const
```

Always use `as const` on your routes array for correct type inference.

### 2. Create and install the router

```ts
import { createRouter } from '@kitbag/router'

const router = createRouter(routes)

// Register types via declaration merging
declare module '@kitbag/router' {
  interface Register {
    router: typeof router
  }
}

app.use(router)
```

### 3. Navigate with type-safe `push`, `replace`, and `RouterLink`

```ts
import { useRouter } from '@kitbag/router'

const router = useRouter()

// Programmatic — params are type-checked against route definition
router.push('user', { userId: 42 })
router.replace('home')
```

```vue
<template>
  <!-- Callback-style `to` gives type-safe resolve -->
  <router-link :to="(resolve) => resolve('user', { userId: 42 })">
    Profile
  </router-link>
</template>
```

### 4. Access the current route with `useRoute`

```ts
import { useRoute } from '@kitbag/router'

// Unnarrowed — all possible params are optional
const route = useRoute()

// Narrowed to a specific route — params are typed
const userRoute = useRoute('user')
userRoute.params.userId // number
```

Params are reactive and support `v-model` for two-way binding (especially useful for query params):

```vue
<input v-model="route.params.search" />
<select v-model="route.params.sort">
  <option value="asc">Ascending</option>
  <option value="desc">Descending</option>
</select>
```

### 5. Use hooks for guards, redirects, and lifecycle

```ts
import { createRoute } from '@kitbag/router'

const protectedRoute = createRoute({
  name: 'dashboard',
  path: '/dashboard',
})
  .addView(Dashboard)

// Route-level before-hook — use `throw reject(...)` to stop execution
protectedRoute.onBeforeRouteEnter((to, { reject, replace }) => {
  if (!isAuthenticated()) {
    throw reject('NotFound')
  }
})

// Route-level after-hook — second arg includes `push` for navigation
protectedRoute.onAfterRouteEnter((to, { push }) => {
  if (to.params.search === 'secret') {
    push('hiddenRoute')
  }
})

// In-component hooks
import { onBeforeRouteLeave } from '@kitbag/router'

onBeforeRouteLeave((to, { abort }) => {
  if (hasUnsavedChanges.value) {
    abort()
  }
})
```

## Additional Features

### Query params, `unionOf`, and `withDefault`

Query params are first-class. Use shorthand strings for untyped params, or `withParams` with `unionOf`/`withDefault` for constrained values:

```ts
import { createRoute, withParams, unionOf, withDefault } from '@kitbag/router'

// Shorthand — defaults to String type
const search = createRoute({
  name: 'search',
  path: '/search',
  query: 'q=[?q]',
})

// Typed with constrained values and a default
const keys = createRoute({
  name: 'keys',
  path: '/keys',
  query: withParams('sort=[?sort]', {
    sort: withDefault(unionOf(['asc', 'desc']), 'asc'),
  }),
})
```

### Context — scoping routes and rejections

Routes can declare `context` — an array of other routes or rejections that are only accessible when that route is active:

```ts
const secretPage = createRoute({ name: 'secret', path: '/secret' })
  .addView(SecretView)

const main = createRoute({
  name: 'main',
  path: '/main',
  context: [secretPage],
}).addView(MainView)

// Rejections can also be scoped via context
const notAuthorized = createRejection({ type: 'NotAuthorized', component: LoginView })

const protectedRoute = createRoute({
  name: 'protected',
  path: '/protected',
  context: [notAuthorized],
})
```

### RouterView scoped slot for transitions

Use the `#default` slot with `{ component }` to wrap route views in `<transition>`:

```vue
<router-view>
  <template #default="{ component }">
    <transition name="fade" mode="out-in">
      <component :is="component" />
    </transition>
  </template>
</router-view>
```

## Type Inference Gotchas

1. **You must register the router** via declaration merging — without this, composables like `useRoute` and `useRouter` have no type context.
2. **Routes array must use `as const`** — without it TypeScript widens route names to `string` and params lose their types.
3. **`useRoute('name')` narrows types** — only use this inside components you know are mounted under that route. Using the wrong name gives a runtime error.
4. **Param names must be unique** across the full route tree (including parent routes). Duplicate param names throw `DuplicateParamsError`.

## APIs That Changed — Don't Write the Old Form

LLMs trained on older data may generate outdated patterns. The correct forms are:

| Wrong (old/never existed) | Correct |
|---|---|
| `createRoute({ component: Foo })` | `createRoute({ ... }).addView(Foo)` |
| `createRoute({ props: { ... } })` | `.addView(Foo, { props: (route) => ({ ... }) })` |
| `router.addRoute(...)` | Routes are static — pass all routes to `createRouter(routes)` |
| `useRoute().params.value.id` | `useRoute().params.id` (params is already reactive, not a ref) |
| `<router-link to="/path">` | `<router-link :to="(resolve) => resolve('name', params)">` (callback style) |
| `<router-link :to="{ name: 'foo' }">` | `<router-link :to="(resolve) => resolve('foo')">` |
| `router.beforeEach(...)` | Use `onBeforeRouteEnter` on the route or pass hooks to `createRouter` |
| `{ path: '/user/:id' }` | `{ path: withParams('/user/[id]', { id: Number }) }` (square brackets, explicit type) |
| `meta: { requiresAuth: true }` inline | `createRoute({ meta: { requiresAuth: true } })` (same place, but access differs) |
| `reject('NotFound')` | `throw reject('NotFound')` (`throw` is needed to stop hook execution) |

## Key Differences from vue-router

- **No `$route`/`$router` globals** — use `useRoute()` and `useRouter()` composables.
- **No route config arrays with `children`** — use `parent` property on `createRoute` to build hierarchy.
- **No catch-all `/:pathMatch(.*)*`** — use the built-in `NotFound` rejection.
- **Params use `[brackets]`** not `:colon` syntax. Optional: `[?param]`, greedy: `[param*]`.
- **Rejections** replace vue-router's 404/error handling. Create custom rejections with `createRejection`.
- **Props are type-safe** — assigned via `.addView(Component, { props: (route) => ({ ... }) })`.
- **Query params are first-class** — defined with the same `withParams` syntax on the `query` property.
- **Plugins** bundle routes, rejections, and hooks into reusable units via `createRouterPlugin`.
- **Context** scopes routes and rejections to only be accessible when a parent route is active.
- **Params support `v-model`** — two-way binding works directly on `route.params`.
