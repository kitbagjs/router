# useNavigation

Tells you whether a navigation is in progress, where it is going, and how far along it is. See [navigation progress](/advanced-concepts/navigation-progress) for what the router counts.

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

Every value is a readonly ref, so you can use them in templates and watchers directly.

| Property | Type | Description |
| --- | --- | --- |
| pending | `boolean` | True while a navigation is in progress |
| to | `ResolvedRoute \| null` | The route being navigated to. Null when idle, or when the url does not match a route |
| from | `ResolvedRoute \| null` | The route being navigated away from. Null when idle, or for the first navigation |
| settled | `number` | How many units have finished so far |
| total | `number` | How many units the navigation is waiting on in total |
| progress | `number` | `settled / total`, between 0 and 1. Zero while idle |

After a navigation ends, `settled` equals `total` if it reached its route, and both are zero if it was rejected or aborted. That is how a progress bar can tell whether to fill up or just disappear.
