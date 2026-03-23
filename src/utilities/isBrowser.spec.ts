import { expect, test } from "vite-plus/test";
import { isBrowser } from "@/utilities/isBrowser";

test("isBrowser returns false when environment is node", () => {
  expect(isBrowser()).toBe(false);
});
