# Types: GetData\<TLoaders\>

```ts
type GetData<TLoaders> = <TName>(...args) => Promise<Awaited<ReturnType<TLoaders[TName]["load"]>>>;
```

Reads a loader by name. Omitting the name selects `default` when declared.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tloaders"></a> `TLoaders` *extends* [`RouteLoaders`](RouteLoaders.md) | `Record`\<`string`, [`Loader`](Loader.md)\> |

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-__typetname"></a> `TName` *extends* keyof `TLoaders` & `string` | `Extract`\<`"default"`, keyof `TLoaders`\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| ...`args` | `TName` *extends* `"default"` ? \[`name?`: `TName`\] : \[`name`: `TName`\] |

## Returns

`Promise`\<`Awaited`\<`ReturnType`\<`TLoaders`\[`TName`\]\[`"load"`\]\>\>\>
