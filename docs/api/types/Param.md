# Types: Param\<T\>

```ts
type Param<T> = object;
```

A param definition that parses and stringifies values.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` | `unknown` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="defaultvalue"></a> `defaultValue?` | `T` |
| <a id="get"></a> `get` | [`ParamGetter`](ParamGetter.md)\<`T`\> |
| <a id="set"></a> `set` | [`ParamSetter`](ParamSetter.md)\<`T`\> |
