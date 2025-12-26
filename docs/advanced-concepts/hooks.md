# Hooks

Hooks offer a way to register callbacks on router lifecycle events.  

```ts
onAfterRouteEnter: (to, context) => {
   ...
}
```

## Lifecycle

### Before Hooks

- **onBeforeRouteEnter:** Triggered before a route gets mounted.
- **onBeforeRouteUpdate:** Triggered before a route changes. Specifically when the route changed but that parent or child didn’t.
- **onBeforeRouteLeave:** Triggered before a route is about to be unmounted

### After Hooks

- **onAfterRouteLeave:** Triggered after a route gets unmounted.
- **onAfterRouteUpdate:** Triggered after a route changes. Specifically when the route changed but that parent or child didn’t.
- **onAfterRouteEnter:** Triggered after a route is mounted

### On Error

- **onError** Triggered whenever an unexpected error is thrown. If the hook returns true, the error is considered handled and the other hooks are not run. If all hooks return false the error is rethrown

## Context

The router provides `to` and a `context` argument to your hook callback. The context will always include:

| Property | Description |
| ---- | ---- |
| from | What was the route prior to the hook's execution |
| push | Convenient way to move the user from wherever they were to a new route. |
| replace | Same as push, but with `options: { replace: true }`. |
| reject | Trigger a [rejection](/advanced-concepts/rejections) for the router to handle |

See [AfterRouteHookContext](/api/types/AfterRouteHookContext)

If the hooks lifecycle is a [before](/advanced-concepts/hooks#before-hooks) hook, you'll also have access to the following property in your context:

| Property | Description |
| ---- | ---- |
| abort | Stops the router from continuing with route change |

See [BeforeRouteHookContext](/api/types/BeforeRouteHookContext)

If the hook is `onError`, you'll also have access to the following properties in your context:

| Property | Description |
| ---- | ---- |
| to | What was the destination route prior to the error being thrown |
| source | String value indicating where the error occurred. Possible values are `'props'`, `'hook'`, and `'component'` |

See [RouterErrorHookContext](/api/types/RouterErrorHookContext)

## Levels

Hooks can be registered **globally**, on your **route**, or from within a **component**. This is useful for both providing the most convenient dx, but also can be a useful tool for ensuring proper execution order of your business logic.

### Execution Order

1. Global hooks
1. Route hooks
1. Component Hooks

### Global

```ts
router.onAfterRouteEnter((to, context) => {
  ...
})
```

### Route

```ts
route.onAfterRouteEnter((to, context) => {
  ...
})
```

### Component

In order to register a hook from within a component, you must use the [composition API](https://vuejs.org/guide/extras/composition-api-faq.html#composition-api-faq).

```ts
import { onBeforeRouteLeave } from '@kitbag/router'

onAfterRouteEnter((to, context) => {
  ...
})
```

:::warning
You cannot register `onBeforeRouteEnter` or `onAfterRouteEnter` hooks from within a component, since the component must have been mounted to discover the hook.
:::

## Global Injection

Hooks are run within the context of the Vue app the router is installed. This means you can use vue's `inject` function to access global values.

```ts
import { inject } from 'vue'

router.onAfterRouteEnter(() => {
  const value = inject('global')

  ...
})
```
