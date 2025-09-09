# Types: RouterRouteName\<TRouter\>

```ts
type RouterRouteName<TRouter> = TRouter extends Router<infer TRoutes> ? RoutesName<TRoutes> : RoutesName<Route[]>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRouter` *extends* [`Router`](Router.md) |
