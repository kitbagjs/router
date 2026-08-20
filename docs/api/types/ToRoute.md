# Types: ToRoute\<TOptions, TProps\>

```ts
type ToRoute<TOptions, TProps> = CreateRouteOptions extends TOptions ? Route : Route<ToRouteUrl<TOptions>, ToRouteMatches<TOptions, TProps>>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOptions` *extends* [`CreateRouteOptions`](CreateRouteOptions.md) | - |
| `TProps` *extends* [`CreateRouteProps`](CreateRouteProps.md)\<`TOptions`\> \| `undefined` | `undefined` |
