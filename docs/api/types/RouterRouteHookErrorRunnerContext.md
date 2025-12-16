# Types: RouterRouteHookErrorRunnerContext\<TRoutes\>

```ts
type RouterRouteHookErrorRunnerContext<TRoutes> = object;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="from"></a> `from` | \| [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> \| `null` |
| <a id="source"></a> `source` | `"props"` \| `"hook"` |
| <a id="to"></a> `to` | [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> |
