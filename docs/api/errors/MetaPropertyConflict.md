# MetaPropertyConflict

An error thrown when a parent's meta has the same key as a child and the types are not compatible.

## Extends

- `Error`

## Constructors

### new MetaPropertyConflict()

```ts
new MetaPropertyConflict(property): MetaPropertyConflict
```

Constructs a new MetaPropertyConflict instance with a message that specifies which property key has a conflict.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `property` | `string` | The property key which has conflicting types between parent and child. |

#### Returns

[`MetaPropertyConflict`](MetaPropertyConflict)
