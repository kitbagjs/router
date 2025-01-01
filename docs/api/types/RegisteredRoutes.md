# Types: RegisteredRoutes\<T\>

```ts
type RegisteredRoutes<T> = T extends object ? TRoutes : Route[];
```

Represents the Router routes property within [Register](../interfaces/Register.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | [`Register`](../interfaces/Register.md) |
