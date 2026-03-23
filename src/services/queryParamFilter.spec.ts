import { expect, test } from "vite-plus/test";
import { filterQueryParams } from "./queryParamFilter";

test("given no overlap, returns source unmodified", () => {
  const source = new URLSearchParams("foo=123");
  const exclude = new URLSearchParams("bar=456");

  const response = filterQueryParams(source, exclude);

  expect(response.toString()).toBe("foo=123");
});

test("given exclude with same key but different value, returns source unmodified", () => {
  const source = new URLSearchParams("foo=123");
  const exclude = new URLSearchParams("foo=456");

  const response = filterQueryParams(source, exclude);

  expect(response.toString()).toBe("foo=123");
});

test("given exclude with same key and value, returns source without duplicates", () => {
  const source = new URLSearchParams("foo=123&bar=456");
  const exclude = new URLSearchParams("foo=123");

  const response = filterQueryParams(source, exclude);

  expect(response.toString()).toBe("bar=456");
});

test("given source with multiple values for same key, only removes matching value", () => {
  const source = new URLSearchParams("foo=123&foo=456");
  const exclude = new URLSearchParams("foo=123");

  const response = filterQueryParams(source, exclude);

  expect(response.toString()).toBe("foo=456");
});
