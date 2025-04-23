# Types: RouterRoute\<TRoute\>

```ts
type RouterRoute<TRoute> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoute` *extends* [`ResolvedRoute`](ResolvedRoute.md) | [`ResolvedRoute`](ResolvedRoute.md) |

## Accessors

### query

#### Get Signature

```ts
get query(): URLSearchParams;
```

##### Returns

`URLSearchParams`

#### Set Signature

```ts
set query(value): void;
```

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | \| `undefined` \| `string` \| `URLSearchParams` \| `string`[][] \| `Record`\<`string`, `string`\> |

##### Returns

`void`

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="hash"></a> `hash` | `readonly` | `TRoute`\[`"hash"`\] |
| <a id="href"></a> `href` | `readonly` | `TRoute`\[`"href"`\] |
| <a id="id"></a> `id` | `readonly` | `TRoute`\[`"id"`\] |
| <a id="matched"></a> `matched` | `readonly` | `TRoute`\[`"matched"`\] |
| <a id="matches"></a> `matches` | `readonly` | `TRoute`\[`"matches"`\] |
| <a id="name"></a> `name` | `readonly` | `TRoute`\[`"name"`\] |
| <a id="params"></a> `params` | `public` | `TRoute`\[`"params"`\] |
| <a id="state"></a> `state` | `public` | `TRoute`\[`"state"`\] |
| <a id="update"></a> `update` | `readonly` | `RouteUpdate`\<`TRoute`\> |
