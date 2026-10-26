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

## Reusable loaders

Pass a [reusable loader](/core-concepts/loaders#reusable-loaders) directly to `useLoader`. It looks for
that definition on the current route, including parent routes, and uses the matching attachment.

If the definition is missing or attached more than once, `useLoader` errors. Pass
`route.loaders[name]` to select a specific attachment.

```ts
import { useLoader } from '@kitbag/router'
import { userLoader } from './userLoader'

const user = useLoader(userLoader)
```

## Awaiting data

Await the initial load to use Vue's suspense boundary. A successful await returns the same reactive
refs:

```ts
const { data: user, loading, error } = await useLoader(userLoader)
```

If the initial load fails, the await rejects with the original error, which can be handled with
`try/catch`. An uncaught failure from async setup reaches Vue's error handling. `Suspense` handles
loading; a parent's `onErrorCaptured()` hook can handle async setup errors.

Without an await, failures are exposed through the reactive `error` ref. After a successful await,
the refs continue following navigation: later failures update `error` without rejecting an await
that has already resolved.
