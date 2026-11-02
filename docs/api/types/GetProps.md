# Types: GetProps\<TViews\>

```ts
type GetProps<TViews> = <TName>(...args) => Promise<Awaited<ViewProps<TViews[TName]>>>;
```

Reads view props by name. Omitting the name selects `default` when declared.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tviews"></a> `TViews` *extends* [`RouteViews`](RouteViews.md) | [`RouteViews`](RouteViews.md) |

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-__typetname"></a> `TName` *extends* keyof `ViewsWithProps`\<`TViews`\> & `string` | `Extract`\<`"default"`, keyof `ViewsWithProps`\<`TViews`\>\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| ...`args` | `TName` *extends* `"default"` ? \[`name?`: `TName`\] : \[`name`: `TName`\] |

## Returns

`Promise`\<`Awaited`\<`ViewProps`\<`TViews`\[`TName`\]\>\>\>
