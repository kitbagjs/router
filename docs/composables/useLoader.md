# useLoader

Read a loader's data, loading state, and error. Pass a loader definition, either imported or read from `route.loaders`:

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

Await `useLoader` to wait for the initial data. The returned refs continue to update as you navigate.

```ts
const { data: user, loading, error } = await useLoader(userLoader)
```

## Loader attachments

If a reusable loader is missing from the current route or has multiple attachments, `useLoader` warns and runs it separately. Pass `route.loaders[name]` to select a specific attachment.

Attach reusable loaders with `addLoader` to enable prefetching and SSR hydration.
