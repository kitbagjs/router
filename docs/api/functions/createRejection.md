# Functions: createRejection()

```ts
function createRejection<TType>(options): Pick<RejectionOptions<TType>, "type" | "status"> & object & RejectionHooks<TType> & RouteSetTitle;
```

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-ttype"></a> `TType` *extends* `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `RejectionOptions`\<`TType`\> |

## Returns

`Pick`\<`RejectionOptions`\<`TType`\>, `"type"` \| `"status"`\> & `object` & [`RejectionHooks`](../types/RejectionHooks.md)\<`TType`\> & `RouteSetTitle`
