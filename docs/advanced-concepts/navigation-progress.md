# Navigation Progress

A navigation is under way from the moment it is asked for until the route it leads to has everything it renders with. Kitbag Router counts the work a navigation waits on, so you can show feedback while slow hooks and data hold a page up.

## What is counted

Every unit of work a navigation waits on is known before it runs, so the progress is real rather than an animated guess.

- **Before hooks**, including redirects and global hooks.
- **Props getters and loaders** of every route in the match.
- **Async route components** defined with `defineAsyncComponent`. Only components the routes render are known to the router, so an async component elsewhere in the tree is not counted.

Every unit counts the same. After hooks are not counted because they do not hold up the page. A route that was [prefetched](/advanced-concepts/prefetching) has some of its units settled already, so its navigation finishes sooner.

A navigation ends when its route has everything it renders with, when it is rejected, when it is aborted, or when another navigation begins in its place. A rejection completes the count, since a rejection page is a page too. An abort wipes it. A new navigation, whether from the user or from a `push` in a hook or loader, starts a fresh count of its own.

::: info
Progress is tracked for client side navigations only, not while server rendering or hydrating.
:::

## useNavigation

The `useNavigation` composable tells you whether a navigation is under way, which routes it moves between, and how far it has come.

```vue
<script setup lang="ts">
import { useNavigation } from '@kitbag/router'

const { pending, to, settled, total } = useNavigation()
</script>

<template>
  <div v-if="pending">
    Loading {{ to?.name }}…
    <progress :value="settled" :max="total" />
  </div>
</template>
```

| Property | Type | Description |
| --- | --- | --- |
| pending | `boolean` | True while a navigation is under way |
| to | `ResolvedRoute \| null` | The route the navigation leads to. Null when idle, or when the url matches no route |
| from | `ResolvedRoute \| null` | The route the navigation leaves. Null when idle, or for the first navigation |
| settled | `number` | How many units have settled so far |
| total | `number` | How many units the navigation waits on in all |
| progress | `number` | `settled / total`, between 0 and 1. Zero while idle |

Once a navigation ends, `settled` equals `total` if it reached its route or a rejection, and both are zero if it was aborted. A bar can use that to decide between finishing and disappearing.
