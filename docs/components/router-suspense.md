# RouterSuspense

`RouterSuspense` provides loading and error states for async content and automatically detects errors
from [props getters](/core-concepts/component-props) and awaited
[useLoader](/composables/useLoader#awaiting-data) calls. To catch errors unrelated to routing, use the
`catch` prop.

```vue
<template>
  <RouterSuspense>
    <RouterView />

    <template #fallback>
      <p>Loading…</p>
    </template>

    <template #error="{ error }">
      <p>Unable to load this page: {{ error }}</p>
    </template>
  </RouterSuspense>
</template>
```

## Props

| Prop | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| loaders | false | `boolean` | `true` | Includes awaited `useLoader` errors |
| props | false | `boolean` | `true` | Includes route props getter errors |
| catch | false | `boolean` or `(error: unknown) => boolean` | `false` | Includes all component errors when true, or only errors matching the predicate |

Set `loaders` to `false` to let awaited `useLoader` errors propagate to Vue's error handlers.
The `catch` prop can still capture these errors as component errors.

```vue
<RouterSuspense :loaders="false">
  <RouterView />
</RouterSuspense>
```

```vue
<RouterSuspense catch>
  <RouterView />
</RouterSuspense>
```

```vue
<script setup lang="ts">
import { ExpectedError } from './errors'

const catchError = (error: unknown) => error instanceof ExpectedError
</script>

<template>
  <RouterSuspense :catch="catchError">
    <RouterView />
  </RouterSuspense>
</template>
```

## Recovery

Call `router.refresh()` to restart the current route and render the content again, including when the
URL has not changed.

```vue
<script setup lang="ts">
import { useRouter } from '@kitbag/router'

const router = useRouter()
</script>

<template>
  <RouterSuspense>
    <RouterView />

    <template #error>
      <p>Unable to load this page.</p>
      <button @click="router.refresh()">Try again</button>
    </template>
  </RouterSuspense>
</template>
```
