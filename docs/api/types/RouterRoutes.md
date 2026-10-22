# Types: RouterRoutes\<TRouter\>

```ts
type RouterRoutes<TRouter> = TRouter extends Router<infer TRoutes, any, infer TPlugin> ? Routes extends TRoutes | TPlugin["routes"] ? Routes : TRoutes | TPlugin["routes"] : Routes;
```

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-trouter"></a> `TRouter` *extends* [`Router`](Router.md) |
