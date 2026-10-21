# Types: AddAfterEnterHook\<TRoutes, TRejections, TRouteTo, TRouteFrom\>

```ts
type AddAfterEnterHook<TRoutes, TRejections, TRouteTo, TRouteFrom> = AddHook<AfterEnterHook<TRoutes, TRejections, TRouteTo, TRouteFrom>>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* `Routes` | `Routes` |
| `TRejections` *extends* [`Rejections`](Rejections.md) | [`Rejections`](Rejections.md) |
| `TRouteTo` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
| `TRouteFrom` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
