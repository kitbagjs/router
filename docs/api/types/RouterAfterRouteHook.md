# Types: RouterAfterRouteHook()\<TRoutes, TRejections\>

```ts
type RouterAfterRouteHook<TRoutes, TRejections> = (to, context) => MaybePromise<void>;
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
| `context` | `RouterAfterRouteHookContext`\<`TRoutes`, `TRejections`\> |

## Returns

`MaybePromise`\<`void`\>
