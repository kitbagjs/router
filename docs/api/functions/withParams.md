# Functions: withParams()

## Call Signature

```ts
function withParams<TValue, TParams>(value, params): WithParams<TValue, TParams>
```

### Type Parameters

| Type Parameter |
| ------ |
| `TValue` *extends* `string` |
| `TParams` *extends* `MakeOptional`\<`WithParamsParamsInput`\<`TValue`\>\> |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TValue` |
| `params` | `TParams` |

### Returns

`WithParams`\<`TValue`, `TParams`\>

## Call Signature

```ts
function withParams(): WithParams<"", {}>
```

### Returns

`WithParams`\<`""`, \{\}\>
