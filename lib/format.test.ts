import { describe, expect, it } from "vitest";
import { toRoman } from "./format";

describe("toRoman", () => {
  it.each([
    [1, "I"],
    [2, "II"],
    [3, "III"],
    [4, "IV"],
    [5, "V"],
    [9, "IX"],
    [14, "XIV"],
    [40, "XL"],
    [49, "XLIX"],
    [2026, "MMXXVI"],
  ])("%i -> %s", (n, expected) => {
    expect(toRoman(n)).toBe(expected);
  });
});
