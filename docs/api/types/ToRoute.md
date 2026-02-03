# Types: ToRoute\<TOptions, TProps\>

```ts
type ToRoute<TOptions, TProps> = CreateRouteOptions extends TOptions ? Route : TOptions extends object ? Route<ToName<TOptions["name"]>, CombineUrl<TParent, ToUrl<TOptions>>, CombineMeta<ToMeta<TParent["meta"]>, ToMeta<TOptions["meta"]>>, CombineState<ToState<TParent["state"]>, ToState<TOptions["state"]>>, ToMatches<TOptions, CreateRouteProps<TOptions> extends TProps ? undefined : TProps>, [...ToRouteContext<TParent["context"]>, ...ToRouteContext<TOptions["context"]>]> : Route<ToName<TOptions["name"]>, ToUrl<TOptions>, ToMeta<TOptions["meta"]>, ToState<TOptions["state"]>, ToMatches<TOptions, CreateRouteProps<TOptions> extends TProps ? undefined : TProps>, ToRouteContext<TOptions["context"]>>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOptions` *extends* [`CreateRouteOptions`](CreateRouteOptions.md) | - |
| `TProps` *extends* [`CreateRouteProps`](CreateRouteProps.md)\<`TOptions`\> \| `undefined` | `undefined` |
