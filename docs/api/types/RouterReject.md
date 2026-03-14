# Types: RouterReject()\<TRejections\>

```ts
type RouterReject<TRejections> = <TSource>(type) => void;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRejections` *extends* [`Rejections`](Rejections.md) \| `undefined` |

## Type Parameters

| Type Parameter |
| ------ |
| `TSource` *extends* \| [`RejectionType`](RejectionType.md)\<`TRejections`\> \| `BuiltInRejectionType` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `TSource` |

## Returns

`void`
