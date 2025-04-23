# Functions: withDefault()

```ts
function withDefault<TParam>(param, defaultValue): Required<ParamGetSet<ExtractParamType<TParam>>>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TParam` *extends* [`Param`](../types/Param.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `param` | `TParam` |
| `defaultValue` | `ExtractParamType`\<`TParam`\> |

## Returns

`Required`\<[`ParamGetSet`](../types/ParamGetSet.md)\<`ExtractParamType`\<`TParam`\>\>\>
