# Types: ParamGetSet\<T\>

```ts
type ParamGetSet<T> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `any` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="defaultvalue"></a> `defaultValue?` | `T` |
| <a id="get"></a> `get` | [`ParamGetter`](ParamGetter.md)\<`T`\> |
| <a id="set"></a> `set` | [`ParamSetter`](ParamSetter.md)\<`T`\> |
