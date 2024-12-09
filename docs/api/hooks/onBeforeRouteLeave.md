# Hooks: onBeforeRouteLeave()

```ts
function onBeforeRouteLeave(hook): RouteHookRemove
```

Registers a hook that is called before a route is left. Must be called from setup.
This is useful for performing actions or cleanups before navigating away from a route component.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | [`BeforeRouteHook`](../types/BeforeRouteHook.md) |

## Returns

[`RouteHookRemove`](../types/RouteHookRemove.md)

A function that removes the added hook.
