# Types: ToCallback\<TRouter\>

```ts
type ToCallback<TRouter> = (resolve) => ResolvedRoute | UrlString;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRouter` *extends* [`Router`](Router.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `resolve` | `TRouter`\[`"resolve"`\] |

## Returns

[`ResolvedRoute`](ResolvedRoute.md) \| [`UrlString`](UrlString.md)
