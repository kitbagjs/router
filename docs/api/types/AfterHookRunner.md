# Types: AfterHookRunner()

```ts
type AfterHookRunner = <TRoutes>(context) => Promise<AfterHookResponse>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | \{ `from`: \| [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> \| `null`; `to`: [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\>; \} |
| `context.from` | \| [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> \| `null` |
| `context.to` | [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> |

## Returns

`Promise`\<[`AfterHookResponse`](AfterHookResponse.md)\>
