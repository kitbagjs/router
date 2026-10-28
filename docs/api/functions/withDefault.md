# Functions: withDefault()

```ts
function withDefault<TParamOptions>(param, defaultValue): ParamWithDefault<TParamOptions>;
```

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tparamoptions"></a> `TParamOptions` *extends* [`ParamOptions`](../types/ParamOptions.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `param` | `TParamOptions` |
| `defaultValue` | `ExtractParamType`\<`TParamOptions`\> |

## Returns

`ParamWithDefault`\<`TParamOptions`\>
