# AddBeforeRouteHook

```ts
type AddBeforeRouteHook: (hook) => RouteHookRemove;
```

Adds a hook that is called before a route change. Returns a function to remove the hook.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `hook` | [`BeforeRouteHook`](BeforeRouteHook) | [BeforeRouteHook](BeforeRouteHook) The hook function to add. |

## Returns

[`RouteHookRemove`](RouteHookRemove)
