import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("utils.cn", () => {
  it("merges conflicting tailwind padding classes keeping the last one", () => {
    const result = cn("p-2 p-4", "text-sm");
    expect(result).toBe("p-4 text-sm");
  });
});
