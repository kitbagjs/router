# RouterSuspense

Wrap async content with `RouterSuspense` to provide loading and error states. It is registered
globally by the [router plugin](/quick-start#vue-plugin).

Components can await [useLoader](/composables/useLoader#awaiting-data) inside the default slot.
A non-awaited `useLoader` continues exposing failures through its own `error` ref.

Use the default slot for content, `#fallback` while it awaits setup, and `#error` for failures.
By default, only unexpected errors from route props getters and awaited loaders trigger the error
state. Without an error slot, the component displays a generic error message.

Expected navigation outcomes from `context.push()` or `context.reject()` do not trigger the error state.

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

### catch

Accepts a boolean or an `(error: unknown) => boolean` predicate. Defaults to `false`.
By default, only unexpected errors from route props getters and awaited loaders trigger the error
state. Set `catch` to include all component errors, or pass a predicate to include only matching errors.
Props getter and awaited loader failures are always included, regardless of the predicate.

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
