# Types: CreateRouteProps\<TOptions\>

```ts
type CreateRouteProps<TOptions> = TOptions["component"] extends Component ? PropsGetter<TOptions, TOptions["component"]> : TOptions["components"] extends Record<string, Component> ? RoutePropsRecord<TOptions, TOptions["components"]> : RouterViewPropsGetter<TOptions>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOptions` *extends* [`CreateRouteOptions`](CreateRouteOptions.md) | [`CreateRouteOptions`](CreateRouteOptions.md) |
