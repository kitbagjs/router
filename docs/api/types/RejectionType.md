# Types: RejectionType\<TRejections\>

```ts
type RejectionType<TRejections> = unknown extends TRejections ? never : Rejections extends TRejections ? string : undefined extends TRejections ? string : TRejections extends Rejections ? TRejections[number]["type"] : never;
```

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-trejections"></a> `TRejections` *extends* [`Rejections`](Rejections.md) \| `undefined` |
