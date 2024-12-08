# Types: RouterRoutes\<TRoutes\>

```ts
type RouterRoutes<TRoutes>: { [K in keyof TRoutes]: RouterRoute<ResolvedRoute<TRoutes[K]>> }[number];
```

This type is the same as `RouterRoute<ResolvedRoute<TRoutes[number]>>` while remaining distributive

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |
