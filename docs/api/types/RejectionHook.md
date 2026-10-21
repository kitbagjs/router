# Types: RejectionHook\<TRejection, TRoutes, TRouteTo, TRouteFrom\>

```ts
type RejectionHook<TRejection, TRoutes, TRouteTo, TRouteFrom> = (rejection, context) => MaybePromise<void>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-trejection"></a> `TRejection` *extends* `string` | `string` |
| <a id="type-parameter-troutes"></a> `TRoutes` *extends* `Routes` | `Routes` |
| <a id="type-parameter-trouteto"></a> `TRouteTo` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
| <a id="type-parameter-troutefrom"></a> `TRouteFrom` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `rejection` | `TRejection` |
| `context` | [`RejectionHookContext`](RejectionHookContext.md)\<`TRoutes`, `TRouteTo`, `TRouteFrom`\> |

## Returns

`MaybePromise`\<`void`\>
