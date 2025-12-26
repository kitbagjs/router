# Types: RouterAfterRouteHook()\<TRoutes, TRejections\>

```ts
type RouterAfterRouteHook<TRoutes, TRejections> = (to, context) => MaybePromise<void>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejection`[] | `Rejection`[] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `to` | [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> |
| `context` | `RouterAfterRouteHookContext`\<`TRoutes`, `TRejections`\> |

## Returns

`MaybePromise`\<`void`\>
