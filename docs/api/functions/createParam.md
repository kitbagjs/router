# Functions: createParam()

## Call Signature

```ts
function createParam<TParamOptions>(param): TParamOptions;
```

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tparamoptions"></a> `TParamOptions` *extends* `Required`\<[`Param`](../types/Param.md)\<`unknown`\>\> |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `param` | `TParamOptions` |

### Returns

`TParamOptions`

## Call Signature

```ts
function createParam<TParamOptions>(param): Param<ExtractParamType<TParamOptions>>;
```

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tparamoptions-1"></a> `TParamOptions` *extends* [`ParamOptions`](../types/ParamOptions.md) |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `param` | `TParamOptions` |

### Returns

[`Param`](../types/Param.md)\<`ExtractParamType`\<`TParamOptions`\>\>

## Call Signature

```ts
function createParam<TParamOptions>(param, defaultValue): ParamWithDefault<TParamOptions>;
```

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tparamoptions-2"></a> `TParamOptions` *extends* [`ParamOptions`](../types/ParamOptions.md) |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `param` | `TParamOptions` |
| `defaultValue` | `NoInfer`\<`ExtractParamType`\<`TParamOptions`\>\> |

### Returns

`ParamWithDefault`\<`TParamOptions`\>
