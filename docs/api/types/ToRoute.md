# Types: ToRoute\<TOptions\>

```ts
type ToRoute<TOptions> = CreateRouteOptions extends TOptions ? Route : Route<ToRouteUrl<TOptions>, ToRouteMatches<TOptions>>;
```

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-toptions"></a> `TOptions` *extends* [`CreateRouteOptions`](CreateRouteOptions.md) |
