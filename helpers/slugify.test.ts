import { slugify } from "./slugify";
import { expect, test } from "bun:test";

test("does nothing to empty strings", () => {
  expect(slugify("")).toEqual("");
});
test("removes multiple consecutive spaces", () => {
	expect(slugify("  kory is neat ")).toEqual("kory-is-neat")
})
test("preserves numbers", () => {
	expect(slugify("kory 123")).toEqual("kory-123")
})
test("strips away all special characters", () => {
	expect(slugify("kory@!@#$%^&*()kory.com")).toEqual("korykorycom")
})
test("replaces all whitespace with hyphens", () => {
	expect(slugify("kory\nis\tneat")).toEqual("kory-is-neat")
})
test("ignores hyphens", () => {
	expect(slugify("kory-is-neat")).toEqual("kory-is-neat")
})
