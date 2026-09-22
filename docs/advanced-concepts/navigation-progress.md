# Navigation Progress

When a navigation is slow, whether that is because of a before hook, a loader, or a component that has to be fetched, users want to see that something is happening. Kitbag Router keeps track of how much work each navigation is waiting on so you can show them.

## What is counted

The router knows everything a navigation will wait on before any of it runs, so the progress it reports is real rather than an animation that guesses.

- Before hooks, including redirects and global hooks.
- Props getters and loaders for every route in the match.
- Async route components defined with `defineAsyncComponent`. The router only knows about the components its routes render, so an async component somewhere else in the tree is not counted.

Each of these is one unit, and they all count the same. After hooks are not counted because they do not hold up the page. If a route was [prefetched](/advanced-concepts/prefetching), some of its units are already done when the navigation starts, so it finishes sooner.

A navigation is finished once its route has everything it needs to render. It can also end early if a hook rejects or aborts it, or if another navigation starts before it is done. A rejection counts as finished, since the rejection page is a page too. An abort just clears the count. If a hook or loader pushes somewhere else, that is a new navigation with a fresh count of its own.

::: info
Progress is only tracked for client side navigations, not while server rendering or hydrating.
:::

## useNavigation

Use `useNavigation` to find out whether a navigation is in progress, where it is going, and how far along it is.

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
| pending | `boolean` | True while a navigation is in progress |
| to | `ResolvedRoute \| null` | The route being navigated to. Null when idle, or when the url does not match a route |
| from | `ResolvedRoute \| null` | The route being navigated away from. Null when idle, or for the first navigation |
| settled | `number` | How many units have finished so far |
| total | `number` | How many units the navigation is waiting on in total |
| progress | `number` | `settled / total`, between 0 and 1. Zero while idle |

After a navigation ends, `settled` equals `total` if it finished or was rejected, and both are zero if it was aborted. That is how a progress bar can tell whether to fill up or just disappear.
