# Types: ParamWithDefault\<TParam\>

```ts
type ParamWithDefault<TParam>: Required<ParamGetSet<ExtractParamType<TParam>>>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TParam` *extends* [`Param`](Param.md) | [`Param`](Param.md) |
