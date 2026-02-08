import { describe, it, expect } from "vitest";
import {
  buildFoodItemIndex,
  findCanonicalMatchIndexed,
  findCanonicalMatch,
  computeSuggestedWeeklyQty,
  PurchaseRecord,
} from "@/lib/foodUtils";

describe("foodUtils index and suggestions", () => {
  it("builds index and matches by synonym/name/canonical", () => {
    const items = [
      {
        id: "f1",
        name: "Avena",
        canonical_name: "Avena Integral",
        category: "granos",
        default_unit: "g",
        synonyms: ["avena fina", "avena roll"],
      },
      {
        id: "f2",
        name: "Pan",
        canonical_name: "Pan Blanco",
        category: "granos",
        default_unit: "slice",
        synonyms: ["pan común"],
      },
    ];

    const idx = buildFoodItemIndex(items as any);
    const bySyn = findCanonicalMatchIndexed("avena fina", idx);
    expect(bySyn).toBeTruthy();
    expect(bySyn?.id).toBe("f1");

    const byCanon = findCanonicalMatchIndexed("pan blanco", idx);
    expect(byCanon?.id).toBe("f2");
  });

  it("linear findCanonicalMatch still works", () => {
    const items = [
      {
        id: "f3",
        name: "Yogurt",
        canonical_name: "Yogurt Natural",
        category: "lacteos",
        default_unit: "g",
        synonyms: ["yogur"],
      },
    ];
    const found = findCanonicalMatch("yogur", items as any);
    expect(found).toBeTruthy();
    expect(found?.id).toBe("f3");
  });

  it("computeSuggestedWeeklyQty uses the 4 most recent weeks (by date)", () => {
    const purchases: PurchaseRecord[] = [
      { food_item_id: "x", qty: 500, week_start: "2025-12-01" }, // old large value
      { food_item_id: "x", qty: 1, week_start: "2026-01-01" },
      { food_item_id: "x", qty: 2, week_start: "2026-01-08" },
      { food_item_id: "x", qty: 3, week_start: "2026-01-15" },
      { food_item_id: "x", qty: 4, week_start: "2026-01-22" },
      { food_item_id: "x", qty: 5, week_start: "2026-01-29" },
    ];

    const res = computeSuggestedWeeklyQty(purchases);
    const avg = res.get("x");
    // most recent 4 weeks: 2026-01-29 (5), 2026-01-22 (4), 2026-01-15 (3), 2026-01-08 (2) => avg = 3.5
    expect(avg).toBeCloseTo(3.5, 5);
  });

  it("aggregates multiple purchases in same week and multiple items", () => {
    const purchases: PurchaseRecord[] = [
      { food_item_id: "y", qty: 2, week_start: "2026-01-29" },
      { food_item_id: "y", qty: 3, week_start: "2026-01-29" },
      { food_item_id: "y", qty: 4, week_start: "2026-01-22" },
      { food_item_id: "z", qty: 10, week_start: "2026-01-29" },
    ];

    const res = computeSuggestedWeeklyQty(purchases);
    // y: weeks: 2026-01-29 => 5 (2+3), 2026-01-22 =>4 => average of (5,4) = 4.5
    expect(res.get("y")).toBeCloseTo(4.5, 5);
    expect(res.get("z")).toBeCloseTo(10, 5);
  });
});
