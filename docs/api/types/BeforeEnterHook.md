# Types: BeforeEnterHook()\<TRoutes, TRejections, TRouteTo, TRouteFrom\>

```ts
type BeforeEnterHook<TRoutes, TRejections, TRouteTo, TRouteFrom> = (to, context) => MaybePromise<void>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* `Routes` | `Routes` |
| `TRejections` *extends* [`Rejections`](Rejections.md) | [`Rejections`](Rejections.md) |
| `TRouteTo` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
| `TRouteFrom` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `to` | [`ResolvedRouteUnion`](ResolvedRouteUnion.md)\<`TRouteTo`\> |
| `context` | [`BeforeEnterHookContext`](BeforeEnterHookContext.md)\<`TRoutes`, `TRejections`, `TRouteTo`, `TRouteFrom`\> |

## Returns

`MaybePromise`\<`void`\>
