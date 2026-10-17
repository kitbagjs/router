# useLoader

Read a loader's data, loading state, and error without suspending component setup. Pass a loader definition, either imported or read from `route.loaders`:

```vue
<script setup lang="ts">
import { useLoader, useRoute } from '@kitbag/router'

const route = useRoute('user')
const { data, loading, error } = useLoader(route.loaders.user)
</script>

<template>
  <p v-if="loading">Loading…</p>
  <p v-else-if="error">Unable to load the user.</p>
  <h1 v-else-if="data">{{ data.name }}</h1>
</template>
```

The returned properties are readonly refs. Consumers share the existing route load, including prefetched or hydrated data. When navigation replaces that load, the refs follow its state and clear the previous data and error.

## Reusable loaders

Pass a [reusable loader](/core-concepts/loaders#reusable-loaders) directly to `useLoader`:

```ts
import { useLoader } from '@kitbag/router'
import { userLoader } from './userLoader'

const user = useLoader(userLoader)
```

## Awaiting data

Await the result to get the current load's data. A failed load rejects, and async setup can use Vue's suspense boundary:

```ts
const user = await useLoader(userLoader)
```

The resolved value is a snapshot. Keep the reactive result when the component needs to follow later navigations.

## Fallback loads

If a reusable definition is missing from the current route or has multiple attachments, `useLoader` warns and runs it separately with the current route and its declared [context](/advanced-concepts/context). Pass `route.loaders[name]` to select a specific attachment.

Consumers share that execution for the navigation, and the warning is logged once per loader per navigation. The warning does not populate `error`. During hydration, fallback loads also warn that their data is not included in the SSR payload and may cause a hydration mismatch.

Attach the definition with `addLoader` to start loading before component setup and participate in route prefetching and SSR hydration. Calling `useLoader` does not add an attachment or change `route.data`.

`useLoader` is also available through [`createRouterAssets`](/api/functions/createRouterAssets) for applications using a separate router key.
