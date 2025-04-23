# Functions: createParam()

## Call Signature

```ts
function createParam<TParam>(param): TParam;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TParam` *extends* `Required`\<[`ParamGetSet`](../types/ParamGetSet.md)\<`any`\>\> |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `param` | `TParam` |

### Returns

`TParam`

## Call Signature

```ts
function createParam<TParam>(param): ParamGetSet<ExtractParamType<TParam>>;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TParam` *extends* [`Param`](../types/Param.md) |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `param` | `TParam` |

### Returns

[`ParamGetSet`](../types/ParamGetSet.md)\<`ExtractParamType`\<`TParam`\>\>

## Call Signature

```ts
function createParam<TParam>(param, defaultValue): Required<ParamGetSet<ExtractParamType<TParam>>>;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TParam` *extends* [`Param`](../types/Param.md) |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `param` | `TParam` |
| `defaultValue` | `NoInfer`\<`ExtractParamType`\<`TParam`\>\> |

### Returns

`Required`\<[`ParamGetSet`](../types/ParamGetSet.md)\<`ExtractParamType`\<`TParam`\>\>\>
