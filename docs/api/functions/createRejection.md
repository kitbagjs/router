# Functions: createRejection()

```ts
function createRejection<TType>(options): Pick<RejectionOptions<TType>, "type" | "status"> & object & RejectionHooks<TType> & RouteSetTitle;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TType` *extends* `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `RejectionOptions`\<`TType`\> |

## Returns
