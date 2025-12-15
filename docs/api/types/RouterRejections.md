# Types: RouterRejections\<TRouter\>

```ts
type RouterRejections<TRouter> = TRouter extends Router<any, infer TOptions, infer TPlugins> ? 
  | RejectionType<TOptions["rejections"]>
  | RejectionType<TPlugins["rejections"]> : never;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRouter` *extends* [`Router`](Router.md) |
