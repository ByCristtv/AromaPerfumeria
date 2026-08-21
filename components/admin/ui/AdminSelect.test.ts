import { describe, it, expect } from "vitest";
import type { CSSObjectWithLabel, OptionProps } from "react-select";
import { adminSelectStyles } from "./AdminSelect";
import { ADMIN_ACCENT } from "./styles";

type Option = { value: string; label: string };

/**
 * Guards the accessibility fix: admin dropdown options must render near-black
 * text on the white menu, regardless of the light control color they would
 * otherwise inherit (react-select v5's default option color is `inherit`).
 */
describe("adminSelectStyles option contrast", () => {
  const styles = adminSelectStyles<Option, false, never>();
  const base = {} as CSSObjectWithLabel;

  const optionColor = (state: {
    isSelected?: boolean;
    isFocused?: boolean;
    isDisabled?: boolean;
  }) =>
    styles.option!(base, state as unknown as OptionProps<Option, false, never>);

  it("uses near-black text on the white menu for a resting option", () => {
    const s = optionColor({});
    expect(s.color).toBe("#191420");
    expect(s.backgroundColor).toBe("#ffffff");
  });

  it("keeps near-black text when the option is focused (red tint bg)", () => {
    const s = optionColor({ isFocused: true });
    expect(s.color).toBe("#191420");
    expect(s.backgroundColor).toBe("rgba(255,11,85, 0.16)");
  });

  it("keeps dark text on the red background for the selected option", () => {
    const s = optionColor({ isSelected: true });
    expect(s.color).toBe("#191420");
    expect(s.backgroundColor).toBe(ADMIN_ACCENT);
  });

  it("mutes a disabled option rather than leaving it to inherit", () => {
    const s = optionColor({ isDisabled: true });
    expect(s.color).toBe("#a2969d");
  });

  it("renders the menu on a solid white surface", () => {
    const menu = styles.menu!(base, {} as never);
    expect(menu.backgroundColor).toBe("#ffffff");
  });
});
