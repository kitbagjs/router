# Types: RouterRejections\<TRouter\>

```ts
type RouterRejections<TRouter> = TRouter extends Router<any, infer TOptions, infer TPlugins> ? ExtractRejections<TOptions> | ExtractRejections<TPlugins> : [];
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRouter` *extends* [`Router`](Router.md) |
