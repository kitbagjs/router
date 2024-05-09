# onAfterRouteLeave()

```ts
function onAfterRouteLeave(hook): RouteHookRemove
```

Registers a hook that is called after a route has been left. Must be called during setup.
This can be used for cleanup actions after the component is no longer active, ensuring proper resource management.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `hook` | [`AfterRouteHook`](../types/AfterRouteHook) |

## Returns

[`RouteHookRemove`](../types/RouteHookRemove)

A function that removes the added hook.
