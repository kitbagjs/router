# Types: ToUrl\<TOptions\>

```ts
type ToUrl<TOptions> = Url<Identity<ToUrlPart<TOptions["host"]>["params"] & ToUrlPart<TOptions["path"]>["params"] & ToUrlQueryPart<TOptions["query"]>["params"] & ToUrlPart<TOptions["hash"]>["params"]>>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TOptions` *extends* [`CreateUrlOptions`](CreateUrlOptions.md) |
