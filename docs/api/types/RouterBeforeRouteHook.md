# Types: RouterBeforeRouteHook()\<TRoutes, TRejections\>

```ts
type RouterBeforeRouteHook<TRoutes, TRejections> = (to, context) => MaybePromise<void>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |
| `TRejections` *extends* `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `to` | [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> |
| `context` | `RouterBeforeRouteHookContext`\<`TRoutes`, `TRejections`\> |

## Returns

`MaybePromise`\<`void`\>
