# Types: RegisteredRouter\<T\>

```ts
type RegisteredRouter<T>: T extends object ? TRouter : Router;
```

Represents the Router property within [Register](../interfaces/Register.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | [`Register`](../interfaces/Register.md) |
