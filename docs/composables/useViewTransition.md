# useViewTransition

Returns the [view transition](/advanced-concepts/view-transitions#the-transition-in-flight) in flight, if any. The same state is available as `router.viewTransition`.

```ts
import { useViewTransition } from '@kitbag/router'

const viewTransition = useViewTransition()

onMounted(async () => {
  await viewTransition.transition?.finished

  heading.value?.focus()
})
```

The returned object is reactive, so read its properties where they are used rather than destructuring them.

| Property | Description |
| --- | --- |
| isTransitioning | True from when a navigation is decided to transition until its animation finishes |
| to | The route being navigated to |
| from | The route being left |
| types | The types the transition runs with |
| transition | The browser's [`ViewTransition`](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition), once started |

:::tip
[Register](/quick-start.html#type-safety) your router to get the proper types for `to` and `from` when using this composable.
:::
