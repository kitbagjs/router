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

| Prop | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| catch | false | `boolean` or `(error: unknown) => boolean` | `false` | Includes all component errors when true, or only errors matching the predicate |

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
