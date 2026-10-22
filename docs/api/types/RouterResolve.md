# Types: RouterResolve\<TRoutes\>

```ts
type RouterResolve<TRoutes> = <TSource>(name, ...args) => ResolvedRoute;
```

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-troutes"></a> `TRoutes` *extends* `Routes` |

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-__typetsource"></a> `TSource` *extends* `RoutesName`\<`TRoutes`\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `TSource` |
| ...`args` | `RouterResolveArgs`\<`TRoutes`, `TSource`\> |

## Returns

[`ResolvedRoute`](ResolvedRoute.md)
