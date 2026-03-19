# Types: AddRejectionHook()\<TRejections, TRoutes, TRouteTo, TRouteFrom\>

```ts
type AddRejectionHook<TRejections, TRoutes, TRouteTo, TRouteFrom> = (hook) => HookRemove;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRejections` *extends* `string` | `string` |
| `TRoutes` *extends* `Routes` | `Routes` |
| `TRouteTo` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
| `TRouteFrom` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | [`RejectionHook`](RejectionHook.md)\<`TRejections`, `TRoutes`, `TRouteTo`, `TRouteFrom`\> |

## Returns

[`HookRemove`](HookRemove.md)
