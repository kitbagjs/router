# Types: Rejection\<TType\>

```ts
type Rejection<TType> = Pick<RejectionOptions<TType>, "type" | "status"> & object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-ttype"></a> `TType` *extends* `string` | `string` |

## Type Declaration

### getTitle

```ts
getTitle: GetTitleCallback;
```

Returns the title of the rejection from its `setTitle` callback.
