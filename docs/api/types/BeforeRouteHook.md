# Types: BeforeRouteHook()

```ts
type BeforeRouteHook: (to, context) => MaybePromise<void>;
```

Represents a function called before a route change, potentially altering the routing operation.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `to` | [`ResolvedRoute`](ResolvedRoute.md) | [ResolvedRoute](ResolvedRoute.md) The resolved route the router is navigating to. |
| `context` | [`BeforeRouteHookContext`](BeforeRouteHookContext.md) | [BeforeRouteHookContext](BeforeRouteHookContext.md) The context providing functions and state for the routing operation. |

## Returns

`MaybePromise`\<`void`\>

Possibly a promise that resolves when the hook's logic has completed.
