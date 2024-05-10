# BeforeRouteHook

```ts
type BeforeRouteHook: (to, context) => MaybePromise<void>;
```

Represents a function called before a route change, potentially altering the routing operation.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `to` | `ResolvedRoute` | ResolvedRoute The resolved route the router is navigating to. |
| `context` | `BeforeRouteHookContext` | BeforeRouteHookContext The context providing functions and state for the routing operation. |

## Returns

`MaybePromise`\<`void`\>
