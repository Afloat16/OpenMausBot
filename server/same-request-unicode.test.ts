import { expect, it } from "vitest";
import { sameRequest } from "./same-request.ts";

const request = (word: string) => `Please translate the following document title exactly and explain its meaning: ${word}`;

it.each([["दिन", "दीन"], ["عَلم", "عِلم"], ["e\u0301cole", "ecole"]])("keeps requests with different word marks apart: %s / %s", (left, right) => {
  expect(sameRequest(request(left), request(right))).toBe(false);
});

it("recognizes canonically equivalent composed and decomposed words", () => {
  expect(sameRequest(request("ÉCOLE"), request("e\u0301cole"))).toBe(true);
});

it("does not turn isolated marks into words or enough text to join short requests", () => {
  const text = `Any update? ${"\u0301".repeat(50)}`;
  expect(sameRequest(text, text)).toBe(false);
  expect(sameRequest(request("title"), `${request("title")} ❤️`)).toBe(true);
});
