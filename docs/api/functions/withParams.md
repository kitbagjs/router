# Functions: withParams()

## Call Signature

```ts
function withParams<TValue, TParams>(value, params): UrlPart<WithParamsParamsOutput<TValue, TParams>>;
```

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tvalue"></a> `TValue` *extends* `string` |
| <a id="type-parameter-tparams"></a> `TParams` *extends* `MakeOptional`\<`WithParamsParamsInput`\<`TValue`\>\> |

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
