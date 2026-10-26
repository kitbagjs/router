# RouterSuspense

Wrap async content with `RouterSuspense` to provide loading and error states. It is registered
globally by the [router plugin](/quick-start#vue-plugin).

Use the default slot for content, `#fallback` while it awaits setup, and `#error` when a route props
getter fails. Without an error slot, the component displays a generic error message. Other component
errors continue through Vue's error handling by default.
The error slot handles client-side failures; server-rendering errors continue to the application's
server error handler.

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

## Component errors

Set `catch` to include all component errors, or pass a predicate to include only errors your app
expects. Props getter failures are always included, regardless of the predicate.

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
  <RouterSuspense>
    <RouterView />

    <template #error>
      <p>Unable to load this page.</p>
      <button @click="router.refresh()">Try again</button>
    </template>
  </RouterSuspense>
</template>
```
