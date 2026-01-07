# Types: BeforeHookRunner()

```ts
type BeforeHookRunner = <TRoutes>(context) => Promise<BeforeHookResponse>;
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

`Promise`\<[`BeforeHookResponse`](BeforeHookResponse.md)\>
