# Loaders

Loaders fetch data for a route and make it available as `route.data`. Components can await that data in setup before rendering.

## Loading data

Add a loader with the chainable `addLoader` method. The callback receives the resolved route, including its typed params. A loader can return any value or a promise.

```ts
import { createRoute } from '@kitbag/router'
import UserPage from './UserPage.vue'
import { getUser } from './api'

export const user = createRoute({
  name: 'user',
  path: '/users/[id]',
})
.addLoader((route) => getUser(route.params.id))
.addView(UserPage)
```

Here `getUser` is your application's data-fetching function. Register `user` in your router's routes as usual.

## Reading data in a component

Use `useRoute` with the route's name and await `route.data` at the top level of `<script setup>`. The result is typed from the loader's return value.

```vue
<!-- UserPage.vue -->
<script setup lang="ts">
import { useRoute } from '@kitbag/router'

const route = useRoute('user')
const user = await route.data
</script>

<template>
  <h1>{{ user.name }}</h1>
</template>
```

[Register your router](/quick-start#type-safety) to get the correct route names and data types when using `useRoute`.

A single unnamed loader exposes its result directly as `route.data`. This is always a promise, even if the loader returns a value synchronously. Data is also available on `router.route`, but not on a route returned by `router.resolve` or in navigation hooks.

## Named loaders

Give loaders names when a route needs multiple values. Each name becomes a property on `route.data`, with its own promise.

```ts
const user = createRoute({
  name: 'user',
  path: '/users/[id]',
})
.addLoader((route) => getUser(route.params.id), { name: 'user' })
.addLoader((route) => getPosts(route.params.id), { name: 'posts' })
.addView(UserPage)
```

Await the values in your component:

```vue
<script setup lang="ts">
import { useRoute } from '@kitbag/router'

const route = useRoute('user')
const [user, posts] = await Promise.all([route.data.user, route.data.posts])
</script>

<template>
  <h1>{{ user.name }}</h1>
  <p>{{ posts.length }} posts</p>
</template>
```

If you mix an unnamed loader with named loaders, the unnamed result is available as `route.data.default`.

A loader cannot read `route.data` to depend on another loader on the same route. If two requests depend on each other, put them in a single loader and return the values together.

## Parent data

Child routes can access their ancestors' loader results through `route.data`. Give loaders distinct names across a route and its ancestors; two unnamed loaders also conflict because they both use the name `default`.

When a child's loader needs a result from its parent, use `parent.data` from the callback context:

```ts
const user = createRoute({
  name: 'user',
  path: '/users/[id]',
})
.addLoader((route) => getUser(route.params.id), { name: 'user' })

const posts = createRoute({
  parent: user,
  name: 'user.posts',
  path: '/posts',
})
.addLoader(async (_route, { parent }) => {
  const user = await parent.data.user

  return getPosts(user.id)
}, { name: 'posts' })
```

The child route's data contains both `data.user` and `data.posts`. Only wait for parent data when the child actually needs it; otherwise load directly from the route params so both requests can run together.

## Passing loader data as props

You can also await loader data in a [props getter](/core-concepts/component-props). This is useful when the component should receive ordinary props without depending on the router, or when several views need the same loader result.

```ts
const user = createRoute({
  name: 'user',
  path: '/users/[id]',
})
.addLoader((route) => getUser(route.params.id))
.addView(UserPage, {
  props: async (route) => ({
    user: await route.data,
  }),
})
```

In this version, `UserPage` declares a `user` prop instead of calling `useRoute`. The props getter must satisfy the component's props, and the component renders once those props are ready.

## Navigation and errors

Loaders do not block client-side navigation or unrelated views from rendering. A component that awaits its data in setup waits before rendering. Use [RouterProgress](/components/router-progress) to show progress while route data is loading.

Navigating to different params or query values can run loaders again. If you keep a data promise from a navigation that is replaced by another navigation, it can reject with `NavigationAbandonedError`; read the current route's data for the new destination.

The loader's second argument provides navigation helpers, `reject`, and an `AbortSignal`. For example, reject a missing user:

```ts
.addLoader(async (route, { reject }) => {
  const user = await getUser(route.params.id)

  if (!user) {
    reject('NotFound')
  }

  return user
})
```

Pass the context's `signal` to `fetch` or another API that accepts an abort signal to cancel requests when the navigation is abandoned. Unexpected loader errors are reported to the router's [error hooks](/advanced-concepts/hooks#on-error); use [rejections](/advanced-concepts/rejections) for expected outcomes such as a missing record.

## Prefetching and server rendering

Loader prefetching is disabled by default. Enable it with a loader's `prefetch` option or the router, route, or link configuration. See [prefetching loaders](/advanced-concepts/prefetching#prefetching-loaders).

When server rendering, `router.render()` waits for loaders and includes their results in the hydration payload. If a result needs custom serialization, set the loader's `transformer` option. See [server rendering and payload values](/advanced-concepts/server-side-rendering#payload-values).
