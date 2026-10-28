# Functions: arrayOf()

```ts
function arrayOf<TParamOptions>(params, options?): Param<ExtractParamType<TParamOptions[number]>[]>;
```

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tparamoptions"></a> `TParamOptions` *extends* [`ParamOptions`](../types/ParamOptions.md)[] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | `TParamOptions` |
| `options?` | `ArrayOfOptions` |

## Returns

[`Param`](../types/Param.md)\<`ExtractParamType`\<`TParamOptions`\[`number`\]\>[]\>
