# Functions: createExternalRoute()

## Call Signature

```ts
function createExternalRoute<THost, TName, TPath, TQuery, THash, TMeta>(options): Route<ToName<TName>, ToHost<THost>, ToPath<TPath>, ToQuery<TQuery>, ToHash<THash>, TMeta>
```

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `THost` *extends* \| `string` \| `Host`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | - |
| `TName` *extends* `undefined` \| `string` | `undefined` |
| `TPath` *extends* \| `undefined` \| `string` \| `Path`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `TQuery` *extends* \| `undefined` \| `string` \| `Query`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `THash` *extends* `undefined` \| `string` \| `Hash`\<`undefined` \| `string`\> | `undefined` |
| `TMeta` *extends* `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateRouteOptions`](../types/CreateRouteOptions.md)\<`TName`, `TPath`, `TQuery`, `undefined` \| `string` \| `Hash`\<`undefined` \| `string`\>, `Record`\<`string`, `unknown`\>\> & `WithHost`\<`THost`\> & `WithoutParent` |

### Returns

[`Route`](../types/Route.md)\<`ToName`\<`TName`\>, `ToHost`\<`THost`\>, `ToPath`\<`TPath`\>, `ToQuery`\<`TQuery`\>, `ToHash`\<`THash`\>, `TMeta`\>

## Call Signature

```ts
function createExternalRoute<TParent, TName, TPath, TQuery, THash, TMeta>(options): Route<ToName<TName>, Host<"", {}>, CombinePath<TParent["path"], ToPath<TPath>>, CombineQuery<TParent["query"], ToQuery<TQuery>>, CombineHash<TParent["hash"], ToHash<THash>>, CombineMeta<TMeta, TParent["meta"]>>
```

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TParent` *extends* [`Route`](../types/Route.md)\<`string`, `Host`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `Path`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `Query`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `Hash`\<`undefined` \| `string`\>, `Record`\<`string`, `unknown`\>, `Record`\<`string`, [`Param`](../types/Param.md)\>, `undefined` \| `string`\> | - |
| `TName` *extends* `undefined` \| `string` | `undefined` |
| `TPath` *extends* \| `undefined` \| `string` \| `Path`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `TQuery` *extends* \| `undefined` \| `string` \| `Query`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\> | `undefined` |
| `THash` *extends* `undefined` \| `string` \| `Hash`\<`undefined` \| `string`\> | `undefined` |
| `TMeta` *extends* `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateRouteOptions`](../types/CreateRouteOptions.md)\<`TName`, `TPath`, `TQuery`, `undefined` \| `string` \| `Hash`\<`undefined` \| `string`\>, `Record`\<`string`, `unknown`\>\> & `WithoutHost` & `WithParent`\<`TParent`\> |

### Returns

[`Route`](../types/Route.md)\<`ToName`\<`TName`\>, `Host`\<`""`, \{\}\>, `CombinePath`\<`TParent`\[`"path"`\], `ToPath`\<`TPath`\>\>, `CombineQuery`\<`TParent`\[`"query"`\], `ToQuery`\<`TQuery`\>\>, `CombineHash`\<`TParent`\[`"hash"`\], `ToHash`\<`THash`\>\>, `CombineMeta`\<`TMeta`, `TParent`\[`"meta"`\]\>\>
