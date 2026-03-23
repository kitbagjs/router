import { expect, test } from "vite-plus/test";
import { getInitialUrl } from "@/services/getInitialUrl";

test("throws error if initial route is not set", () => {
  expect(() => getInitialUrl()).toThrowError(
    "initialUrl must be set if window.location is unavailable",
  );
});
