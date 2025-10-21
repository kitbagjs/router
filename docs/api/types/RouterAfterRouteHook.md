# Types: RouterAfterRouteHook()\<TRoutes\>

```ts
type RouterAfterRouteHook<TRoutes> = (to, context) => MaybePromise<void>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `to` | `RouterResolvedRouteUnion`\<`TRoutes`\> |
| `context` | `RouterAfterRouteHookContext`\<`TRoutes`\> |

## Returns

`MaybePromise`\<`void`\>
