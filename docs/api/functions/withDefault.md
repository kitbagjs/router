# Functions: withDefault()

```ts
function withDefault<TParam>(param, defaultValue): ParamWithDefault<TParam>
```

## Type Parameters

| Type Parameter |
| ------ |
| `TParam` *extends* [`Param`](../types/Param.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `param` | `TParam` |
| `defaultValue` | `ExtractParamType`\<`TParam`, `string`\> |

## Returns

`ParamWithDefault`\<`TParam`\>
