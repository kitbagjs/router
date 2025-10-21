# Types: RouterBeforeRouteHook()\<TRoutes\>

```ts
type RouterBeforeRouteHook<TRoutes> = (to, context) => MaybePromise<void>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `to` | `RouterResolvedRouteUnion`\<`TRoutes`\> |
| `context` | `RouterBeforeRouteHookContext`\<`TRoutes`\> |

## Returns

`MaybePromise`\<`void`\>
