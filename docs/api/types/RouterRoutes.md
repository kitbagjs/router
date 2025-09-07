# Types: RouterRoutes\<TRouter\>

```ts
type RouterRoutes<TRouter> = TRouter extends Router<infer TRoutes> ? TRoutes : Routes;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRouter` *extends* [`Router`](Router.md) |
