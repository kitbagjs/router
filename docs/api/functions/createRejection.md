# Functions: createRejection()

```ts
function createRejection<TType>(options): Rejection<TType> & RejectionHooks<TType>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TType` *extends* `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `component?`: `Component`; `type`: `TType`; \} |
| `options.component?` | `Component` |
| `options.type` | `TType` |

## Returns

[`Rejection`](../types/Rejection.md)\<`TType`\> & [`RejectionHooks`](../types/RejectionHooks.md)\<`TType`\>
