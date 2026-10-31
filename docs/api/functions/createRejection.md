# Functions: createRejection()

```ts
function createRejection<TType>(options): Rejection<TType> & RejectionHooks<TType> & RouteSetTitle;
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

[`Rejection`](../types/Rejection.md)\<`TType`\> & [`RejectionHooks`](../types/RejectionHooks.md)\<`TType`\> & `RouteSetTitle`
