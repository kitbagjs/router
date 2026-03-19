# Types: RejectionHookRunner()\<TRejection, TRoutes\>

```ts
type RejectionHookRunner<TRejection, TRoutes> = (rejection, context) => void;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRejection` *extends* [`Rejection`](Rejection.md) | [`Rejection`](Rejection.md) |
| `TRoutes` *extends* `Routes` | `Routes` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `rejection` | `TRejection` |
| `context` | \{ `from`: \| [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> \| `null`; `to`: \| [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> \| `null`; \} |
| `context.from` | \| [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> \| `null` |
| `context.to` | \| [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> \| `null` |

## Returns

`void`
