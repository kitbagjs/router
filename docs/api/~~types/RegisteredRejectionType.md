# ~~Types: RegisteredRejectionType\<T\>~~

```ts
type RegisteredRejectionType<T> = T extends object ? RejectionType<TOptions["rejections"]> | BuiltInRejectionType : BuiltInRejectionType;
```

Represents the possible Rejections registered within [Register](../interfaces/Register.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | [`Register`](../interfaces/Register.md) |

## Deprecated

use `createRouter(..., { rejections: {}}) instead
