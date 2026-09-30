# Loaders

Loaders fetch data for a route and make it available as `route.data`. Use a loader when data belongs to the route or is shared by multiple views. If data is only needed as props for one view, a [props getter](/core-concepts/component-props#async-prop-fetching) is often enough.

## Loading data for a view

Add a loader with the chainable `addLoader` method. The callback receives the resolved route, so its params are typed just like they are in a props getter. A loader can return any value or a promise of one.

Await `route.data` in a view's props getter to pass the result to that component:

```ts
import { createRoute } from '@kitbag/router'
import UserPage from './UserPage.vue'
import { getUser } from './api'

export const user = createRoute({
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

Here `getUser` is your application's data-fetching function. Its return type determines the type of `route.data`, and the props getter must satisfy `UserPage`'s props:

```vue
<!-- UserPage.vue -->
<script setup lang="ts">
import type { User } from './api'

defineProps<{ user: User }>()
</script>

<template>
  <h1>{{ user.name }}</h1>
</template>
```

Register `user` in your router's routes as usual. `UserPage` receives its props when the data is ready. Other views can read the same loader result from their own props getters.

## Reading data

A single unnamed loader exposes its result directly as `route.data`. This is always a promise, even if the loader returns a value synchronously.

The current route from `useRoute()` or `router.route` also exposes `data`. If you read it directly in a component, handle the pending and error states and watch for changes to `route.data` when navigation reuses that component. Using a props getter as above lets the router supply the component's props when they are ready.

Loader data is available on the current route and in props getters. It is not available on a route returned by `router.resolve` or in navigation hooks.

## Named loaders

Give loaders names when a route needs multiple values. Each name becomes a property on `route.data`, with its own promise.

```ts
const user = createRoute({
  name: 'user',
  path: '/users/[id]',
})
.addLoader((route) => getUser(route.params.id), { name: 'user' })
.addLoader((route) => getPosts(route.params.id), { name: 'posts' })
.addView(UserPage, {
  props: async (route) => {
    const [user, posts] = await Promise.all([route.data.user, route.data.posts])

    return { user, posts }
  },
})
```

In this example, `UserPage` declares both `user` and `posts` props. If you mix an unnamed loader with named loaders, the unnamed result is available as `route.data.default`.

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

## Navigation and errors

Loaders do not block client-side navigation or unrelated views from rendering. A view that awaits loader data in its props getter waits for those props before rendering. Use [RouterProgress](/components/router-progress) to show progress while route data is loading.

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
