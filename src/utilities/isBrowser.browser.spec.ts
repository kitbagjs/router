import { expect, test } from "vite-plus/test";
import { isBrowser } from "@/utilities/isBrowser";

test("isBrowser returns true when environment is browser", () => {
  expect(isBrowser()).toBe(true);
});
