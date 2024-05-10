# onAfterRouteUpdate

```ts
function onAfterRouteUpdate(hook): RouteHookRemove
```

Registers a hook that is called after a route has been updated. Must be called during setup.
This is ideal for responding to updates within the same route, such as parameter changes, without full component reloads.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `hook` | [`AfterRouteHook`](../types/AfterRouteHook) |

## Returns

[`RouteHookRemove`](../types/RouteHookRemove)

A function that removes the added hook.
