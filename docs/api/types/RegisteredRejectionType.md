# Types: RegisteredRejectionType

```ts
type RegisteredRejectionType: Register extends object ? keyof TOptions["rejections"] | BuiltInRejectionType : BuiltInRejectionType;
```

Represents the possible Rejections registered within [Register](../interfaces/Register.md)
