# Functions: arrayOf()

```ts
function arrayOf<T>(params, options?): ParamGetSet<ExtractParamType<T[number]>[]>
```

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`Param`](../types/Param.md)[] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | `T` |
| `options`? | `ArrayOfOptions` |

## Returns

[`ParamGetSet`](../types/ParamGetSet.md)\<`ExtractParamType`\<`T`\[`number`\]\>[]\>
