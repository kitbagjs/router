# RouterFind

Finds a route object based on the provided lookup parameters.

## Type parameters

| Parameter | Type |
| :------ | :------ |
| `TSource` | [`Name`](/api/types/Route#name) |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `source` | [`Url`](/api/types/Url) \| `TSource` |
| `params` | [`RouterFindArgs`](/api/types/RouterFind#routerfindargs) |

### RouterFindArgs

If source is `Url`, expected type for params is `never`. Else when source is `TSource`, router will require params for required path/query params. If no path/query params on route or all params are optional, the argument will be optional.

## Returns

`ResolvedRoute | undefined`
