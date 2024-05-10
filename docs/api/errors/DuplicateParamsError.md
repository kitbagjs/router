# DuplicateParamsError

An error thrown when duplicate parameters are detected in a route when creating a router.
When defining routes, param names must be unique. This includes params defined in a path
parent and params defined in the query.

## Extends

- `Error`

## Constructors

### new DuplicateParamsError()

```ts
new DuplicateParamsError(paramName): DuplicateParamsError
```

Constructs a new DuplicateParamsError instance with a message indicating the problematic parameter.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `paramName` | `string` | The name of the parameter that was duplicated. |

#### Returns

[`DuplicateParamsError`](DuplicateParamsError)
