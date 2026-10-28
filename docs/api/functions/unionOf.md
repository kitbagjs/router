# Functions: unionOf()

```ts
function unionOf<TParamOptions>(params): Param<ExtractParamType<TParamOptions[number]>>;
```

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tparamoptions"></a> `TParamOptions` *extends* [`ParamOptions`](../types/ParamOptions.md)[] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | `TParamOptions` |

## Returns

[`Param`](../types/Param.md)\<`ExtractParamType`\<`TParamOptions`\[`number`\]\>\>
