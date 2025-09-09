# Types: RouterReject()\<TRejectionType\>

```ts
type RouterReject<TRejectionType> = (type) => void;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRejectionType` *extends* `PropertyKey` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `AsString`\<`TRejectionType`\> \| `BuiltInRejectionType` |

## Returns

`void`
