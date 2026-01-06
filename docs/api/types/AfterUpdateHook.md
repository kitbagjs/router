# Types: AfterUpdateHook()\<TRoutes, TRejections, TRouteTo, TRouteFrom\>

```ts
type AfterUpdateHook<TRoutes, TRejections, TRouteTo, TRouteFrom> = (to, context) => MaybePromise<void>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejections` | `Rejections` |
| `TRouteTo` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
| `TRouteFrom` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `to` | [`ResolvedRouteUnion`](ResolvedRouteUnion.md)\<`TRouteTo`\> |
| `context` | [`AfterUpdateHookContext`](AfterUpdateHookContext.md)\<`TRoutes`, `TRejections`, `TRouteTo`, `TRouteFrom`\> |

## Returns

`MaybePromise`\<`void`\>
