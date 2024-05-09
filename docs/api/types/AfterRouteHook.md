# AfterRouteHook()

```ts
type AfterRouteHook: (to, context) => MaybePromise<void>;
```

Represents a function called after a route change has occurred.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `to` | `ResolvedRoute` | ResolvedRoute The resolved route the router has navigated to. |
| `context` | `AfterRouteHookContext` | AfterRouteHookContext The context providing functions and state for the routing operation. |

## Returns

`MaybePromise`\<`void`\>
