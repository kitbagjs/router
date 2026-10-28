# Types: RejectionHookContext\<TRoutes, TRouteTo, TRouteFrom\>

```ts
type RejectionHookContext<TRoutes, TRouteTo, TRouteFrom> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-troutes"></a> `TRoutes` *extends* `Routes` | `Routes` |
| <a id="type-parameter-trouteto"></a> `TRouteTo` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
| <a id="type-parameter-troutefrom"></a> `TRouteFrom` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="from"></a> `from` | [`ResolvedRouteUnion`](ResolvedRouteUnion.md)\<`TRouteFrom`\> \| `null` |
| <a id="remove"></a> `remove` | [`HookRemove`](HookRemove.md) |
| <a id="to"></a> `to` | [`ResolvedRouteUnion`](ResolvedRouteUnion.md)\<`TRouteTo`\> \| `null` |
