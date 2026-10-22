# Functions: withDefault()

```ts
function withDefault<TParam>(param, defaultValue): ParamWithDefault<TParam>;
```

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tparam"></a> `TParam` *extends* [`Param`](../types/Param.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `param` | `TParam` |
| `defaultValue` | `ExtractParamType`\<`TParam`\> |

## Returns

`ParamWithDefault`\<`TParam`\>
