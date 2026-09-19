# Types: Rejection\<TType\>

```ts
type Rejection<TType> = Pick<RejectionOptions<TType>, "type" | "status"> & object;
```

## Type Declaration

### getTitle

```ts
getTitle: GetTitleCallback;
```

Returns the title of the rejection from its `setTitle` callback.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TType` *extends* `string` | `string` |
