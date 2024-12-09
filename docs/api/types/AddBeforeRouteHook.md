# Types: AddBeforeRouteHook()

```ts
type AddBeforeRouteHook: (hook) => RouteHookRemove;
```

Adds a hook that is called before a route change. Returns a function to remove the hook.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hook` | [`BeforeRouteHook`](BeforeRouteHook.md) | [BeforeRouteHook](BeforeRouteHook.md) The hook function to add. |

## Returns

[`RouteHookRemove`](RouteHookRemove.md)

A function that removes the added hook.
