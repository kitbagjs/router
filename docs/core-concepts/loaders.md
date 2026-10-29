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

Pass a definition from `route.loaders` to [`useLoader`](/composables/useLoader).

```vue
<!-- UserPage.vue -->
<script setup lang="ts">
import { useLoader, useRoute } from '@kitbag/router'

const route = useRoute('user')
const { data: user } = useLoader(route.loaders.default)
</script>

<template>
  <h1 v-if="user">{{ user.name }}</h1>
</template>
```

[Register your router](/core-concepts/type-safety#registration) to get the correct route names and data types when using `useRoute`.

## Suspense

Await `useLoader` at the top level of `<script setup>` to use Vue's Suspense.

```ts
const { data: user } = await useLoader(route.loaders.default)
```

Use [RouterSuspense](/components/router-suspense) to provide loading and error states.

## Named loaders

Give loaders names when a route needs multiple values. Each name becomes a property on `route.loaders`, such as `route.loaders.user` and `route.loaders.posts`:

```ts
const user = createRoute({...})
  .addLoader((route) => getUser(route.params.id), { name: 'user' })
  .addLoader((route) => getPosts(route.params.id), { name: 'posts' })
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

## Using loader data in props callbacks

A [props callback](/core-concepts/component-props) can await `route.data` to build the props its view needs.

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

## Navigation cancellation

Dependency reads inside callbacks are cancelled with the navigation: awaiting `route.data`, `parent.data`, or `parent.props` rejects with `NavigationAbandonedError` when the computation is abandoned. This stops the dependent callback and runs its `finally` blocks. The router handles this cancellation without calling application error hooks. If a callback catches dependency errors, rethrow cancellation so it can unwind normally.

## Migrating component data reads

The deprecated `router.route.data` property has been removed. In components, use [`useLoader`](/composables/useLoader) with a reusable loader or a definition from `route.loaders`:

```ts
const route = useRoute()
const { data, loading, error } = useLoader(route.loaders.default)
```
