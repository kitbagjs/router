# Types: RouterReject()\<TRejections\>

```ts
type RouterReject<TRejections> = <TSource>(type) => void;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRejections` *extends* `Rejections` \| `undefined` |

## Type Parameters

| Type Parameter |
| ------ |
| `TSource` *extends* `RejectionType`\<`TRejections`\> \| `BuiltInRejectionType` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TSource` |

## Returns

`void`
