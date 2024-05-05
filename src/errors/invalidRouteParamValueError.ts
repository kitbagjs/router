/**
 * Represents an error thrown when an invalid value is assigned to a route parameter.
 * This error indicates a mismatch of param value provided in the URL and the expected format for the param.
 * For example if a param is type Boolean but the URL provides a non-boolean value such as "ABC".
 * Custom Param types are given the string value from the URL as well as an `invalid` function.
 * If `invalid` is called, this the the error thrown.
 */
export class InvalidRouteParamValueError extends Error {}
