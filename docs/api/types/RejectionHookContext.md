# Types: RejectionHookContext\<TRoutes, TRouteTo, TRouteFrom\>

```ts
type RejectionHookContext<TRoutes, TRouteTo, TRouteFrom> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* `Routes` | `Routes` |
| `TRouteTo` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
| `TRouteFrom` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="from"></a> `from` | [`ResolvedRouteUnion`](ResolvedRouteUnion.md)\<`TRouteFrom`\> \| `null` |
| <a id="to"></a> `to` | [`ResolvedRouteUnion`](ResolvedRouteUnion.md)\<`TRouteTo`\> \| `null` |
