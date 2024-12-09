# Types: AfterRouteHook()

```ts
type AfterRouteHook: (to, context) => MaybePromise<void>;
```

Represents a function called after a route change has occurred.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `to` | `ResolvedRoute` | ResolvedRoute The resolved route the router has navigated to. |
| `context` | [`AfterRouteHookContext`](AfterRouteHookContext.md) | [AfterRouteHookContext](AfterRouteHookContext.md) The context providing functions and state for the routing operation. |

## Returns

`MaybePromise`\<`void`\>

Possibly a promise that resolves when the hook's logic has completed.
