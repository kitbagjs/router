# useLoader

> `useLoader` replaces component reads of `route.data`, deprecated in [0.31.0](/upgrading/0.31.0#component-loader-data).

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

If the definition is missing or attached more than once, `useLoader` warns and runs it separately.
Pass `route.loaders[name]` to select a specific attachment.

```ts
import { useLoader } from '@kitbag/router'
import { userLoader } from './userLoader'

const user = useLoader(userLoader)
```

## Awaiting data

Await `useLoader` inside [RouterSuspense](/components/router-suspense) to use its loading and error
slots. The awaited result contains `data` and `loading`; `data` has the loader's return type without
an added `undefined`, and there is no `error` ref.

```ts
const { data: user, loading } = await useLoader(userLoader)
```

During subsequent loads, `data` retains its last successful value until the replacement is ready.
Failures after a successful await are handled by the surrounding error boundary.

## Loader attachments

Attach reusable loaders with `addLoader` to enable prefetching and SSR hydration.
