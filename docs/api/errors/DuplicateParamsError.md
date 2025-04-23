# Errors: DuplicateParamsError

An error thrown when duplicate parameters are detected in a route.
Param names must be unique. This includes params defined in a path
parent and params defined in the query.

## Extends

- `Error`

## Constructors

### Constructor

```ts
new DuplicateParamsError(paramName): DuplicateParamsError;
```

Constructs a new DuplicateParamsError instance with a message indicating the problematic parameter.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `paramName` | `string` | The name of the parameter that was duplicated. |

#### Returns

`DuplicateParamsError`

#### Overrides

```ts
Error.constructor
```

## Properties

| Property | Type | Inherited from |
| ------ | ------ | ------ |
| <a id="cause"></a> `cause?` | `unknown` | `Error.cause` |
| <a id="message"></a> `message` | `string` | `Error.message` |
| <a id="name"></a> `name` | `string` | `Error.name` |
| <a id="stack"></a> `stack?` | `string` | `Error.stack` |
