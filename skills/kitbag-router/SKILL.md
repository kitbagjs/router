---
name: kitbag-router
description: >
  Use when writing Vue 3 routing code with @kitbag/router — route definitions
  with createRoute, type-safe navigation, params with withParams, route hooks,
  rejections, RouterLink, RouterView, useRoute, useRouter, or useLink.
---

# @kitbag/router Skill

Type-safe router for Vue 3. This is NOT vue-router — it has a completely different API.

## Installation

```bash
npm install @kitbag/router
```

## Route Definitions

Routes are created individually with `createRoute`, not as a config array:

```ts
import { createRoute, withParams } from '@kitbag/router'

// Simple route
const home = createRoute({ name: 'home', path: '/' })
  .addView(HomeView)

// Route with typed params
const post = createRoute({
  name: 'post',
  path: withParams('/blog/[slug]', { slug: String }),
})
  .addView(PostView, {
    props: (route) => ({ slug: route.params.slug }),
  })

// Nested route (parent-child)
const settings = createRoute({ name: 'settings', path: '/settings' })
  .addView(SettingsLayout)

const profile = createRoute({
  parent: settings,
  name: 'profile',
  path: '/profile',
})
  .addView(ProfileView)

// addView also accepts render functions
const inline = createRoute({ name: 'inline', path: '/inline' })
  .addView({ render: () => h('div', 'Inline content') })
```

Collect routes in an array with `as const`:

```ts
const routes = [home, post, settings, profile] as const
```

## Router Setup

```ts
import { createRouter } from '@kitbag/router'

const router = createRouter(routes)

// REQUIRED for type inference — register via declaration merging
declare module '@kitbag/router' {
  interface Register {
    router: typeof router
  }
}

// Install as Vue plugin
app.use(router)
```

## Param Syntax

Params use **square brackets**, not colons:

- `[id]` — required param (matches one or more characters including `/`)
- `[?id]` — optional param
- `[id*]` — greedy (explicitly captures multiple segments)
- `[?id*]` — optional greedy

Type params with `withParams`:

```ts
import { withParams } from '@kitbag/router'

// Built-in types: String, Number, Boolean, Date, RegExp, JSON
path: withParams('/user/[userId]', { userId: Number })

// Query params — with withParams for typed params
query: withParams('tab=[activeTab]', { activeTab: String })

// Query params — shorthand string for untyped params (defaults to String)
query: 'search=[?search]'
```

### unionOf and withDefault

Use `unionOf` to restrict a param to specific string values, and `withDefault` to set a default:

```ts
import { withParams, unionOf, withDefault } from '@kitbag/router'

const keys = createRoute({
  name: 'keys',
  path: '/keys',
  query: withParams('sort=[?sort]', {
    sort: withDefault(unionOf(['asc', 'desc']), 'asc'),
  }),
})
```

### Custom param types with createParam

```ts
import { createParam } from '@kitbag/router'

const sortParam = createParam((value, { invalid }) => {
  if (['asc', 'desc'].includes(value)) return value
  throw invalid('invalid sort direction')
}, 'asc') // second arg is default value
```

Custom params also work with Zod/Valibot schemas.

## Context

Routes can declare `context` — an array of other routes or rejections that become accessible only when that route is active:

```ts
const secretPage = createRoute({
  name: 'secret',
  path: '/secret',
}).addView(SecretView)

const main = createRoute({
  name: 'main',
  path: '/main',
  context: [secretPage],
}).addView(MainView)

// Rejections can also be scoped via context
const notAuthorized = createRejection({
  type: 'NotAuthorized',
  component: LoginView,
})

const protectedRoute = createRoute({
  name: 'protected',
  path: '/protected',
  context: [notAuthorized],
})
```

## Navigation

```ts
const router = useRouter()

// Type-safe — route name and params are checked at compile time
router.push('post', { slug: 'hello-world' })
router.replace('home')

// Resolve without navigating
const resolved = router.resolve('post', { slug: 'hello-world' })
```

## Components

### RouterView

```vue
<template>
  <router-view />
  <!-- Named views -->
  <router-view name="sidebar" />
</template>
```

#### Scoped slot for transitions

Use the `#default` slot with `{ component }` to wrap route views in `<transition>`:

```vue
<template>
  <router-view>
    <template #default="{ component }">
      <transition name="fade" mode="out-in">
        <component :is="component" />
      </transition>
    </template>
  </router-view>
</template>
```

### RouterLink

```vue
<template>
  <!-- Type-safe callback style (preferred) -->
  <router-link :to="(resolve) => resolve('post', { slug: 'hello' })">
    Read Post
  </router-link>

  <!-- Slot props for active state -->
  <router-link :to="(resolve) => resolve('home')" v-slot="{ isExactActive }">
    <span :class="{ active: isExactActive }">Home</span>
  </router-link>
</template>
```

## Composables

### useRoute

```ts
import { useRoute } from '@kitbag/router'

// All possible route params (union type)
const route = useRoute()

// Narrowed to specific route — params fully typed
const postRoute = useRoute('post')
postRoute.params.slug // string
```

Params are reactive and support `v-model` for two-way binding (useful for query params):

```vue
<input v-model="route.params.search" />
<select v-model="route.params.sort">
  <option value="asc">Ascending</option>
  <option value="desc">Descending</option>
</select>
```

### useRouter

```ts
import { useRouter } from '@kitbag/router'
const router = useRouter()
router.push('home')
```

### useLink

```ts
import { useLink } from '@kitbag/router'
const link = useLink('post', { slug: 'hello' })
link.isMatch // boolean ref
link.isExactMatch // boolean ref
link.push() // navigate
```

### useQueryValue

```ts
import { useQueryValue } from '@kitbag/router'
const tab = useQueryValue('tab') // Ref<string | undefined>
```

## Type Utilities

### RouterRouteName

Extract the union of all route names from a router instance:

```ts
import { RouterRouteName } from '@kitbag/router'

export type MyRouteNames = RouterRouteName<typeof router>
```

## Hooks

Register at route level or in components. Before-hooks receive a second argument with control methods. After-hooks also receive a second argument with `push` for navigation.

```ts
// Route-level
myRoute.onBeforeRouteEnter((to, { reject, replace, abort }) => { ... })
myRoute.onAfterRouteEnter((to, { push }) => { ... })
myRoute.onBeforeRouteLeave((to, { abort }) => { ... })
myRoute.onBeforeRouteUpdate((to, { abort }) => { ... })

// In-component
import { onBeforeRouteLeave, onBeforeRouteUpdate } from '@kitbag/router'
onBeforeRouteLeave((to, { abort }) => { ... })
```

## Rejections (not vue-router errors)

Handle 404 and custom rejections:

```ts
import { createRejection } from '@kitbag/router'

const AuthRequired = createRejection({
  type: 'AuthRequired',
  component: LoginView,
})

const router = createRouter(routes, {
  rejections: [AuthRequired],
})

// Trigger from a hook — use throw to stop execution
myRoute.onBeforeRouteEnter((_to, { reject }) => {
  throw reject('AuthRequired')
})
```

Built-in `NotFound` rejection handles unmatched URLs automatically.

## Plugins

Bundle routes, rejections, and hooks for reuse:

```ts
import { createRouterPlugin } from '@kitbag/router'

const authPlugin = createRouterPlugin({
  routes: [loginRoute],
  rejections: [AuthRequired],
  onBeforeRouteEnter: [(_to, { reject }) => {
    if (!isAuthenticated()) throw reject('AuthRequired')
  }],
})

const router = createRouter(routes, {
  plugins: [authPlugin],
})
```

## Common Mistakes

- **Don't use `:param` syntax** — use `[param]` with square brackets.
- **Don't use `{ component: ... }` in route config** — use `.addView(Component)` chain.
- **Don't use `<router-link to="/path">`** — use the callback `:to="(resolve) => resolve('name')"`.
- **Don't use `router.beforeEach`** — use `onBeforeRouteEnter` on routes or pass hooks to `createRouter`.
- **Don't forget `as const`** on the routes array.
- **Don't forget declaration merging** — register your router type or composables won't be typed.
- **`useRoute().params` is reactive directly** — don't wrap in `.value`, it's not a ref. Supports `v-model`.
- **Use `throw reject(...)` in hooks** — not just `reject(...)`. The `throw` is needed to stop hook execution.
