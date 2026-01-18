# Types: BeforeEnterHookContext\<TRoutes, TRejections, TRouteTo, TRouteFrom\>

```ts
type BeforeEnterHookContext<TRoutes, TRejections, TRouteTo, TRouteFrom> = BeforeHookContext<TRouteTo, TRoutes, TRejections> & object;
```

## Type Declaration

### from

```ts
from: ResolvedRouteUnion<TRouteFrom> | null;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejections` | `Rejections` |
| `TRouteTo` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
| `TRouteFrom` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
