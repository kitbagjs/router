# useLoader

Read a loader's data, loading state, and error without suspending component setup. Pass a loader definition, either imported or read from `route.loaders`:

```vue
<script setup lang="ts">
import { useLoader } from '@kitbag/router'
import { userLoader } from './userLoader'

const { data, loading, error } = useLoader(userLoader)
</script>

<template>
  <p v-if="loading">Loading…</p>
  <p v-else-if="error">Unable to load the user.</p>
  <h1 v-else-if="data">{{ data.name }}</h1>
</template>
```

The returned properties are readonly refs. Consumers share the existing route load, including prefetched or hydrated data. When navigation replaces that load, the refs follow its state and clear the previous data and error.

## Route loaders

Use a [route loader definition](/core-concepts/loaders#loader-definitions) for an inline loader or to select a specific attachment:

```ts
const route = useRoute('user')
const user = useLoader(route.loaders.user)
```

An unnamed loader is available as `route.loaders.default`. If the same reusable definition has multiple attachments in the matched route, pass its definition from `route.loaders` to select an attachment.

## Awaiting data

Await the result to get the current load's data. A failed load rejects, and async setup can use Vue's suspense boundary:

```ts
const user = await useLoader(userLoader)
```

The resolved value is a snapshot. Keep the reactive result when the component needs to follow later navigations.

## Unattached loaders

If a reusable definition is not attached to the current route, `useLoader` warns and runs it with the current route and its declared [context](/advanced-concepts/context). Consumers share that execution for the navigation. A new navigation starts a new load and cancels pending work from the previous one.

Attach the definition with `addLoader` to start loading before component setup and participate in route prefetching and SSR hydration. Calling `useLoader` does not add an attachment or change `route.data`.

`useLoader` is also available through [`createRouterAssets`](/api/functions/createRouterAssets) for applications using a separate router key.
