# Types: RouterRoute\<TRoute\>

```ts
type RouterRoute<TRoute>: object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoute` *extends* [`ResolvedRoute`](ResolvedRoute.md) | [`ResolvedRoute`](ResolvedRoute.md) |

## Type declaration

### hash

```ts
readonly hash: TRoute["hash"];
```

### href

```ts
readonly href: TRoute["href"];
```

### id

```ts
readonly id: TRoute["id"];
```

### matched

```ts
readonly matched: TRoute["matched"];
```

### matches

```ts
readonly matches: TRoute["matches"];
```

### name

```ts
readonly name: TRoute["name"];
```

### params

```ts
params: TRoute["params"];
```

### state

```ts
state: TRoute["state"];
```

### update

```ts
readonly update: RouteUpdate<TRoute>;
```

### query

#### Get Signature

```ts
get query(): ResolvedRouteQuery
```

##### Returns

`ResolvedRouteQuery`

#### Set Signature

```ts
set query(value): void
```

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | \| `undefined` \| `string` \| `string`[][] \| `Record`\<`string`, `string`\> \| `URLSearchParams` |

##### Returns

`void`
