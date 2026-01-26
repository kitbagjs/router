# Types: ErrorHookRunnerContext\<TRoutes\>

```ts
type ErrorHookRunnerContext<TRoutes> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="from"></a> `from` | \| [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> \| `null` |
| <a id="source"></a> `source` | `"props"` \| `"hook"` |
| <a id="to"></a> `to` | [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> |
