# onAfterRouteEnter()

```ts
function onAfterRouteEnter(hook): RouteHookRemove
```

Registers a hook that is called after a route has been entered. Must be called during setup.
This allows performing actions right after the component becomes active, such as fetching data or setting up event listeners.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `hook` | [`AfterRouteHook`](../types/AfterRouteHook) |

## Returns

[`RouteHookRemove`](../types/RouteHookRemove)

A function that removes the added hook.
