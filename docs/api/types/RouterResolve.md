# Types: RouterResolve()\<TRoutes\>

```ts
type RouterResolve<TRoutes> = <TSource>(name, ...args) => ResolvedRoute;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |

## Type Parameters

| Type Parameter |
| ------ |
| `TSource` *extends* `RoutesName`\<`TRoutes`\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `TSource` |
| ...`args` | `RouterResolveArgs`\<`TRoutes`, `TSource`\> |

## Returns

[`ResolvedRoute`](ResolvedRoute.md)
