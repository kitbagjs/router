# Errors: MetaPropertyConflict

An error thrown when a parent's meta has the same key as a child and the types are not compatible.
A child's meta can override properties of the parent, however the types must match!

## Extends

- `Error`

## Constructors

### Constructor

```ts
new MetaPropertyConflict(property?): MetaPropertyConflict;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `property?` | `string` |

#### Returns

`MetaPropertyConflict`

#### Overrides

```ts
Error.constructor
```

## Methods

### isError()

```ts
static isError(error): error is Error;
```

Indicates whether the argument provided is a built-in Error instance or not.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | `unknown` |

#### Returns

`error is Error`

#### Inherited from

```ts
Error.isError
```

## Properties

| Property | Type | Inherited from |
| ------ | ------ | ------ |
| <a id="cause"></a> `cause?` | `unknown` | `Error.cause` |
| <a id="message"></a> `message` | `string` | `Error.message` |
| <a id="name"></a> `name` | `string` | `Error.name` |
| <a id="stack"></a> `stack?` | `string` | `Error.stack` |
