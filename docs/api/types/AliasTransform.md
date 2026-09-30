# Types: AliasTransform\<TParams, TRouteParams\>

```ts
type AliasTransform<TParams, TRouteParams> = (context) => TRouteParams;
```

Maps what an alias matched into the params the route declares. Runs synchronously during matching. Any
param the route declares that the alias pattern does not carry must be supplied here.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TParams` | `Record`\<`string`, `unknown`\> | The alias's own params. |
| `TRouteParams` | `Record`\<`string`, `unknown`\> | The params of the route the alias belongs to. |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`AliasTransformContext`](AliasTransformContext.md)\<`TParams`\> |

## Returns

`TRouteParams`
