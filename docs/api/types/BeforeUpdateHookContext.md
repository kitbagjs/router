# Types: BeforeUpdateHookContext\<TRoutes, TRejections, TRouteTo, TRouteFrom\>

```ts
type BeforeUpdateHookContext<TRoutes, TRejections, TRouteTo, TRouteFrom> = BeforeHookContext<TRouteTo, TRoutes, TRejections> & object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-troutes"></a> `TRoutes` *extends* `Routes` | `Routes` |
| <a id="type-parameter-trejections"></a> `TRejections` *extends* [`Rejections`](Rejections.md) | [`Rejections`](Rejections.md) |
| <a id="type-parameter-trouteto"></a> `TRouteTo` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
| <a id="type-parameter-troutefrom"></a> `TRouteFrom` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |

## Type Declaration

### from

```ts
from: ResolvedRouteUnion<TRouteFrom> | null;
```
