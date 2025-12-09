# Types: RouterRejections\<TRouter\>

```ts
type RouterRejections<TRouter> = TRouter extends Router<any, infer TOptions, infer TPlugins> ? 
  | keyof TOptions["rejections"]
  | KeysOfUnion<TPlugins["rejections"]> : PropertyKey;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRouter` *extends* [`Router`](Router.md) |
