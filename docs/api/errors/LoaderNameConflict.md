# Errors: LoaderNameConflict

An error thrown when a loader is added with the same name as a loader on one of the route's ancestors.
A route's data combines the loaders of every match, so the same name twice would be ambiguous rather
than an override.

## Extends

- `Error`

## Constructors

### Constructor

```ts
new LoaderNameConflict(name?): LoaderNameConflict;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name?` | `string` |

#### Returns

`LoaderNameConflict`

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
