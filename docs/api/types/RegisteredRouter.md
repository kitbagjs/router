# Types: RegisteredRouter\<T\>

```ts
type RegisteredRouter<T> = T extends object ? T["router"] : Router;
```

Represents the Router property within [Register](../interfaces/Register.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` | [`Register`](../interfaces/Register.md) |
