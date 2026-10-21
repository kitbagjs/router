# Types: RouterRoutes\<TRouter\>

```ts
type RouterRoutes<TRouter> = TRouter extends Router<infer TRoutes, any, infer TPlugin> ? Routes extends TRoutes | TPlugin["routes"] ? Routes : TRoutes | TPlugin["routes"] : Routes;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRouter` *extends* [`Router`](Router.md) |
