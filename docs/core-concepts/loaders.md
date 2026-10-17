# Loaders

Loaders fetch data for a route. Components read their reactive state with [`useLoader`](/composables/useLoader), and props callbacks can await their results through `route.data`.

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

## Reusable loaders

Create a loader separately when several routes need the same loading logic. Like an inline loader, its callback receives the resolved route. Reusing a definition computes data separately for each route. Loaders can be passed [context](/advanced-concepts/context) to enable them to reference other routes and rejections:

```ts
import { createLoader, createRoute } from '@kitbag/router'

const sessionLoader = createLoader({
  load: (route, { signal }) => getSession({
    signal,
    url: route.href,
  }),
  prefetch: 'intent',
})

const user = createRoute({...})
  .addLoader(sessionLoader)

const settings = createRoute({...})
  .addLoader(sessionLoader, {
    name: 'session',
    prefetch: false,
  })
```

## Reading data in a component

Pass a definition from `route.loaders` to [`useLoader`](/composables/useLoader). Await it at the top level of `<script setup>` to wait for the initial load while keeping the returned refs reactive.

```vue
<!-- UserPage.vue -->
<script setup lang="ts">
import { useLoader, useRoute } from '@kitbag/router'

const route = useRoute('user')
const { data: user } = await useLoader(route.loaders.default)
</script>

<template>
  <h1 v-if="user">{{ user.name }}</h1>
</template>
```

[Register your router](/core-concepts/type-safety#registration) to get the correct route names and data types when using `useRoute`.

## Named loaders

Give loaders names when a route needs multiple values. Each name becomes a property on `route.loaders`.

```ts
const user = createRoute({
  name: 'user',
  path: '/users/[id]',
})
.addLoader((route) => getUser(route.params.id), { name: 'user' })
.addLoader((route) => getPosts(route.params.id), { name: 'posts' })
.addView(UserPage)
```

Await the initial loads in your component:

```vue
<script setup lang="ts">
import { useLoader, useRoute } from '@kitbag/router'

const route = useRoute('user')
const [{ data: user }, { data: posts }] = await Promise.all([
  useLoader(route.loaders.user),
  useLoader(route.loaders.posts),
])
</script>

<template>
  <h1 v-if="user">{{ user.name }}</h1>
  <p v-if="posts">{{ posts.length }} posts</p>
</template>
```

Unnamed loaders are available as `route.loaders.default`.

A loader cannot read `route.data` to depend on another loader on the same route. If two requests depend on each other, put them in a single loader and return the values together.

## Loader definitions

`route.loaders` exposes the current route's loader definitions, including inline and inherited loaders. Each entry has the same `Loader` type returned by `createLoader`. Unnamed loaders use `route.loaders.default`.

Pass a definition to [`useLoader`](/composables/useLoader) to read its reactive data, loading, and error state.

```ts
const route = useRoute('user')
const user = useLoader(route.loaders.user)
```

## Parent data

Child routes inherit their ancestors' loaders and their results. Give loaders distinct names across a route and its ancestors; two unnamed loaders also conflict because they both use the name `default`.

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

The child route exposes both `loaders.organization` and `loaders.invoices`. The invoices request must wait for the billing account ID. If a child only needs a value already available in `route.params`, use that directly so the requests can run together.

## Using loader data in props callbacks

A [props callback](/core-concepts/component-props) can await `route.data` and use it to build the props its view needs. A single unnamed loader exposes its promise directly as `route.data`; named loaders expose their promises as `route.data[name]`. If only one view needs the data, fetching it directly in that callback is often enough. A loader is useful when multiple views depend on the same data.

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

## Prefetching

Loader prefetching is disabled by default. Enable it with a loader's `prefetch` option or the router, route, or link configuration. See [prefetching loaders](/advanced-concepts/prefetching#prefetching-loaders).
