# onBeforeRouteUpdate

```ts
function onBeforeRouteUpdate(hook): RouteHookRemove
```

Registers a hook that is called before a route is updated. Must be called from setup.
This is particularly useful for handling changes in route parameters or query while staying within the same component.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `hook` | [`BeforeRouteHook`](../types/BeforeRouteHook) |

## Returns

[`RouteHookRemove`](../types/RouteHookRemove)

A function that removes the added hook.
