# Types: RouterRejectInternal\<TRejections\>

```ts
type RouterRejectInternal<TRejections> = RouterReject<TRejections> & (type, context?) => void;
```

Reject as the router itself calls it, which may name any rejection type and supply the routes the
rejection happened between. The router exposes [RouterReject](RouterReject.md) instead.

## Type Parameters

| Type Parameter |
| ------ |
| `TRejections` *extends* [`Rejections`](Rejections.md) \| `undefined` |
