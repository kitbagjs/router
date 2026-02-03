# Types: ToUrl\<TOptions\>

```ts
type ToUrl<TOptions> = Url<ToUrlParams<ToWithParams<TOptions["host"]>> & ToUrlParams<ToWithParams<TOptions["path"]>> & ToUrlParams<ToWithParams<TOptions["query"]>> & ToUrlParams<ToWithParams<TOptions["hash"]>>>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TOptions` *extends* [`CreateUrlOptions`](CreateUrlOptions.md) |
