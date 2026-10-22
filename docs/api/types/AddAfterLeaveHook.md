# Types: AddAfterLeaveHook\<TRoutes, TRejections, TRouteTo, TRouteFrom\>

```ts
type AddAfterLeaveHook<TRoutes, TRejections, TRouteTo, TRouteFrom> = AddHook<AfterLeaveHook<TRoutes, TRejections, TRouteTo, TRouteFrom>>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-troutes"></a> `TRoutes` *extends* `Routes` | `Routes` |
| <a id="type-parameter-trejections"></a> `TRejections` *extends* [`Rejections`](Rejections.md) | [`Rejections`](Rejections.md) |
| <a id="type-parameter-trouteto"></a> `TRouteTo` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
| <a id="type-parameter-troutefrom"></a> `TRouteFrom` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
