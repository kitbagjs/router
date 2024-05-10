# AddAfterRouteHook

```ts
type AddAfterRouteHook: (hook) => RouteHookRemove;
```

Adds a hook that is called after a route change. Returns a function to remove the hook.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `hook` | [`AfterRouteHook`](AfterRouteHook) | [AfterRouteHook](AfterRouteHook) The hook function to add. |

## Returns

[`RouteHookRemove`](RouteHookRemove)
