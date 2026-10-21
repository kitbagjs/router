# Types: AddBeforeEnterHook\<TRoutes, TRejections, TRouteTo, TRouteFrom\>

```ts
type AddBeforeEnterHook<TRoutes, TRejections, TRouteTo, TRouteFrom> = AddHook<BeforeEnterHook<TRoutes, TRejections, TRouteTo, TRouteFrom>>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* `Routes` | `Routes` |
| `TRejections` *extends* [`Rejections`](Rejections.md) | [`Rejections`](Rejections.md) |
| `TRouteTo` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
| `TRouteFrom` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
