import { describe, it, expect } from "vitest";
import { expandCategoryFilter, type GenderCategoryIds } from "./catalogCategoryFilter";

const IDS: Required<GenderCategoryIds> = {
  hombre: "id-hombre",
  mujer: "id-mujer",
  unisex: "id-unisex",
};

describe("expandCategoryFilter", () => {
  it("Hombre → Hombre + Unisex", () => {
    expect(expandCategoryFilter(IDS.hombre, IDS)).toEqual([IDS.hombre, IDS.unisex]);
  });

  it("Mujer → Mujer + Unisex", () => {
    expect(expandCategoryFilter(IDS.mujer, IDS)).toEqual([IDS.mujer, IDS.unisex]);
  });

  it("Unisex → Unisex only (never duplicated)", () => {
    expect(expandCategoryFilter(IDS.unisex, IDS)).toEqual([IDS.unisex]);
  });

  it("a non-gender category filters by itself only", () => {
    expect(expandCategoryFilter("id-nicho", IDS)).toEqual(["id-nicho"]);
  });

  it("does not append Unisex when the Unisex category is not seeded", () => {
    const noUnisex: GenderCategoryIds = { hombre: IDS.hombre, mujer: IDS.mujer };
    expect(expandCategoryFilter(IDS.hombre, noUnisex)).toEqual([IDS.hombre]);
  });

  it("Hombre still expands even if Mujer is absent from the map", () => {
    const partial: GenderCategoryIds = { hombre: IDS.hombre, unisex: IDS.unisex };
    expect(expandCategoryFilter(IDS.hombre, partial)).toEqual([IDS.hombre, IDS.unisex]);
  });
});
