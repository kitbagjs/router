# Types: AfterLeaveHookContext\<TRoutes, TRejections, TRouteTo, TRouteFrom\>

```ts
type AfterLeaveHookContext<TRoutes, TRejections, TRouteTo, TRouteFrom> = AfterHookContext<TRouteTo, TRoutes, TRejections> & object;
```

## Type Declaration

### from

```ts
from: ResolvedRouteUnion<TRouteFrom>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejections` | `Rejections` |
| `TRouteTo` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
| `TRouteFrom` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
