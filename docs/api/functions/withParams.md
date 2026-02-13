# Functions: withParams()

## Call Signature

```ts
function withParams<TValue, TParams>(value, params): UrlPart<WithParamsParamsOutput<TValue, TParams>>;
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

`UrlPart`\<`WithParamsParamsOutput`\<`TValue`, `TParams`\>\>

## Call Signature

```ts
function withParams(): UrlPart<{
}>;
```

### Returns

`UrlPart`\<\{
\}\>
