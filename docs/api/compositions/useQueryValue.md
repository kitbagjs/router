# Compositions: useQueryValue()

```ts
const useQueryValue: {
  (key): UseQueryValue<string>;
<TParam>  (key, param): UseQueryValue<ExtractParamType<TParam>>;
};
```

A composition to access a specific query value from the current route.

## Call Signature

```ts
(key): UseQueryValue<string>;
```

### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `MaybeRefOrGetter`\<`string`\> |

### Returns

`UseQueryValue`\<`string`\>

## Call Signature

```ts
<TParam>(key, param): UseQueryValue<ExtractParamType<TParam>>;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TParam` *extends* [`Param`](../types/Param.md) |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `MaybeRefOrGetter`\<`string`\> |
| `param` | `TParam` |

### Returns

`UseQueryValue`\<`ExtractParamType`\<`TParam`\>\>

## Returns

The query value from the router.
