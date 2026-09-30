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

When a child's loader needs a value returned by its parent's request, use `parent.data` from the callback context. For example, an organization's invoices require its billing account ID, which is returned with the organization and is not in the URL:

```ts
const organization = createRoute({
  name: 'organization',
  path: '/organizations/[slug]',
})
.addLoader((route) => getOrganization(route.params.slug), { name: 'organization' })

const invoices = createRoute({
  parent: organization,
  name: 'organization.invoices',
  path: '/invoices',
})
.addLoader(async (_route, { parent }) => {
  const organization = await parent.data.organization

  return getInvoices(organization.billingAccountId)
}, { name: 'invoices' })
```

The child route's data contains both `data.organization` and `data.invoices`. The invoices request must wait for the billing account ID. If a child only needs a value already available in `route.params`, use that directly so the requests can run together.

## Using loader data in props callbacks

A [props callback](/core-concepts/component-props) can await loader data and use it to build the props its view needs. If only one view needs the data, fetching it directly in that callback is often enough. A loader is useful when multiple views depend on the same data.

For example, load a project once, then use it to prepare a summary and a list of incomplete tasks:

```ts
const project = createRoute({
  name: 'project',
  path: '/projects/[id]',
})
.addLoader((route) => getProject(route.params.id))
.addView(ProjectSummary, {
  props: async (route) => {
    const project = await route.data

    return {
      title: project.name,
      completedTaskCount: project.tasks.filter((task) => task.completed).length,
    }
  },
})
.addView(TaskList, {
  name: 'tasks',
  props: async (route) => {
    const project = await route.data

    return {
      tasks: project.tasks.filter((task) => !task.completed),
    }
  },
})
```

Both callbacks use the same loader result, so they do not need separate requests for the project. Each callback derives the props for its own component. Render the views with a default `<router-view />` and a named `<router-view name="tasks" />`.

## Prefetching and server rendering

Loader prefetching is disabled by default. Enable it with a loader's `prefetch` option or the router, route, or link configuration. See [prefetching loaders](/advanced-concepts/prefetching#prefetching-loaders).

When server rendering, `router.render()` waits for loaders and includes their results in the hydration payload. If a result needs custom serialization, set the loader's `transformer` option. See [server rendering and payload values](/advanced-concepts/server-side-rendering#payload-values).
