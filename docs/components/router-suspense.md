# RouterSuspense

Wrap async content with `RouterSuspense` to provide loading and error states. It is registered
globally by the [router plugin](/quick-start#vue-plugin).

Use the default slot for content, `#fallback` while it awaits setup, and `#error` for failures.
Set `catch` to include all component errors, or pass a predicate to include specific errors.
Without an error slot, the component displays a generic error message.

```vue
<template>
  <RouterSuspense catch>
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
| catch | false | `boolean` or `(error: unknown) => boolean` | `false` | Includes all component errors when true, or only errors matching the predicate |

```vue
<RouterSuspense catch>
  <AsyncPage />
</RouterSuspense>
```

```vue
<script setup lang="ts">
import { ExpectedError } from './errors'

const catchError = (error: unknown) => error instanceof ExpectedError
</script>

<template>
  <RouterSuspense :catch="catchError">
    <AsyncPage />
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
  <RouterSuspense catch>
    <RouterView />

    <template #error>
      <p>Unable to load this page.</p>
      <button @click="router.refresh()">Try again</button>
    </template>
  </RouterSuspense>
</template>
```
