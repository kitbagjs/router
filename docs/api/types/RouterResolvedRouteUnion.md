# Types: RouterResolvedRouteUnion\<TRoutes\>

```ts
type RouterResolvedRouteUnion<TRoutes> = { [K in keyof TRoutes]: ResolvedRoute<TRoutes[K]> }[number];
```

This type is the same as `ResolvedRoute<TRoutes[number]>` while remaining distributive

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-troutes"></a> `TRoutes` *extends* `Routes` |
