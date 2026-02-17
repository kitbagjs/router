# Types: RouterRouteUnion\<TRoutes\>

```ts
type RouterRouteUnion<TRoutes> = { [K in keyof TRoutes]: TRoutes[K]["name"] extends "" ? never : RouterRoute<ResolvedRoute<TRoutes[K]>> }[number];
```

This type is the same as `RouterRoute<ResolvedRoute<TRoutes[number]>>` while remaining distributive.
Routes without a name (empty string) are excluded so that router.route.name is never ''.

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |
