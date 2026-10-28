# Functions: withParams()

## Call Signature

```ts
function withParams<TValue, TParamOptions>(value, params): UrlPart<WithParamsParamsOutput<TValue, TParamOptions>>;
```

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tvalue"></a> `TValue` *extends* `string` |
| <a id="type-parameter-tparamoptions"></a> `TParamOptions` *extends* `MakeOptional`\<`WithParamsParamsInput`\<`TValue`\>\> |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TValue` |
| `params` | `TParamOptions` |

### Returns

`UrlPart`\<`WithParamsParamsOutput`\<`TValue`, `TParamOptions`\>\>

## Call Signature

```ts
function withParams(): UrlPart<{
}>;
```

### Returns

`UrlPart`\<\{
\}\>
