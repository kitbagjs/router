# Types: RejectionHook()\<TRejection, TRoutes, TRouteTo, TRouteFrom\>

```ts
type RejectionHook<TRejection, TRoutes, TRouteTo, TRouteFrom> = (rejection, context) => MaybePromise<void>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRejection` *extends* `string` | `string` |
| `TRoutes` *extends* `Routes` | `Routes` |
| `TRouteTo` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
| `TRouteFrom` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `rejection` | `TRejection` |
| `context` | [`RejectionHookContext`](RejectionHookContext.md)\<`TRoutes`, `TRouteTo`, `TRouteFrom`\> |

## Returns

`MaybePromise`\<`void`\>
