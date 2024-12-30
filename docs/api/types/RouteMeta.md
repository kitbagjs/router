# Types: RouteMeta\<T\>

```ts
type RouteMeta<T> = T extends object ? RouteMeta : Record<string, unknown>;
```

Represents additional metadata associated with a route, customizable via declaration merging.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | [`Register`](../interfaces/Register.md) |
