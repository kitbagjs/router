# Types: ToRoute\<TOptions, TProps\>

```ts
type ToRoute<TOptions, TProps> = CreateRouteOptions extends TOptions ? Route : TOptions extends object ? Route<ToName<TOptions["name"]>, ToWithParams<TParent["host"]>, CombinePath<ToWithParams<TParent["path"]>, ToWithParams<TOptions["path"]>>, CombineQuery<ToWithParams<TParent["query"]>, ToWithParams<TOptions["query"]>>, CombineHash<ToWithParams<TParent["hash"]>, ToWithParams<TOptions["hash"]>>, CombineMeta<ToMeta<TParent["meta"]>, ToMeta<TOptions["meta"]>>, CombineState<ToState<TParent["state"]>, ToState<TOptions["state"]>>, ToMatches<TOptions, TProps>, [...ToRouteContext<TParent["context"]>, ...ToRouteContext<TOptions["context"]>]> : Route<ToName<TOptions["name"]>, TOptions extends object ? ToWithParams<TOptions["host"]> : WithParams<"", {
}>, ToWithParams<TOptions["path"]>, ToWithParams<TOptions["query"]>, ToWithParams<TOptions["hash"]>, ToMeta<TOptions["meta"]>, ToState<TOptions["state"]>, ToMatches<TOptions, TProps>, ToRouteContext<TOptions["context"]>>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TOptions` *extends* [`CreateRouteOptions`](CreateRouteOptions.md) |
| `TProps` *extends* [`CreateRouteProps`](CreateRouteProps.md)\<`TOptions`\> \| `undefined` |
