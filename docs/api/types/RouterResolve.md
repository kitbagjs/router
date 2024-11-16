# RouterResolve

Resolves a URL to a route object.

## Type parameters

| Parameter | Type |
| :------ | :------ |
| `TSource` | [`Name`](/api/types/Route#name) |

## Parameters

If source is `Url`

| Parameter | Type |
| :------ | :------ |
| `source` | [`Url`](/api/types/Url) |
| `options` | [`RouterResolveOptions`](/api/types/RouterResolve#routerresolveoptions) \| `undefined` |

If source is `TSource`

| Parameter | Type |
| :------ | :------ |
| `source` | `TSource` |
| `params` | [`RouterResolveArgs`](/api/types/RouterResolve#routerresolveargs) |
| `options` | [`RouterResolveOptions`](/api/types/RouterResolve#routerresolveoptions) \| `undefined` |

### RouterResolveArgs

If source is `Url`, expected type for params is `never`. Else when source is `TSource`, router will require params for required path/query params. If no path/query params on route or all params are optional, the argument will be optional.

### RouterResolveOptions

```ts
{
  query?: QuerySource,
  hash?: string,
}
```

[QuerySource](/api/types/QuerySource)

## Returns

`Url`
