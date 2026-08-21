"use client";

import ReactSelect, {
  type GroupBase,
  type Props,
  type StylesConfig,
} from "react-select";
import { ADMIN_ACCENT } from "./styles";

/**
 * Shared react-select theming for every dropdown in the admin panel.
 *
 * Why this exists — the bug it fixes: the admin forms apply `input-field-custom`
 * (which sets `color:#f4eef0` on a dark control) to their <Select>. react-select
 * v5's default option color is `inherit` (see its optionCSS), and the menu
 * renders on a white background — so the options inherited that light-gray
 * control color and became unreadable on white. Setting the color per field is
 * fragile and easy to miss on the next new form, so instead every admin dropdown
 * routes through this component and the option color is pinned to near-black in
 * exactly one place.
 *
 * Only the menu/option layers are themed here. The control (the closed input the
 * user sees before opening) keeps whatever each form already gives it via its
 * own className, so no field's resting appearance changes — this is a contrast
 * fix for the open menu, nothing more.
 */
export function adminSelectStyles<
  Option,
  IsMulti extends boolean,
  Group extends GroupBase<Option>
>(): StylesConfig<Option, IsMulti, Group> {
  return {
    menu: (base) => ({
      ...base,
      backgroundColor: "#ffffff",
      border: "1px solid rgba(255,11,85, 0.35)",
      boxShadow: "0 12px 32px -12px rgba(0, 0, 0, 0.45)",
      overflow: "hidden",
      zIndex: 50,
    }),
    menuList: (base) => ({ ...base, paddingTop: 4, paddingBottom: 4 }),
    option: (base, state) => ({
      ...base,
      // Explicit near-black text on the white menu — never inherit the light
      // control color. Meets WCAG AA on all three backgrounds below.
      color: state.isDisabled ? "#a2969d" : "#191420",
      backgroundColor: state.isSelected
        ? ADMIN_ACCENT
        : state.isFocused
          ? "rgba(255,11,85, 0.16)"
          : "#ffffff",
      cursor: state.isDisabled ? "not-allowed" : "pointer",
      ":active": {
        backgroundColor: state.isDisabled
          ? undefined
          : "rgba(255,11,85, 0.28)",
      },
    }),
    // Selected chips render on react-select's default white control, so they use
    // a solid red fill with near-black text — the same red/near-black pairing
    // as a selected option above, which meets WCAG AA on white. (A translucent
    // red tint with light text was unreadable here.)
    multiValue: (base) => ({
      ...base,
      backgroundColor: ADMIN_ACCENT,
      border: "1px solid #d40040",
    }),
    multiValueLabel: (base) => ({ ...base, color: "#191420" }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#191420",
      ":hover": { backgroundColor: "#d40040", color: "#ffffff" },
    }),
    noOptionsMessage: (base) => ({ ...base, color: "#6f656c" }),
  };
}

/**
 * Drop-in replacement for react-select's default export, pre-themed for the
 * admin panel. Any caller-provided `styles` are merged last so a specific form
 * can still override a layer when it truly needs to.
 */
export default function AdminSelect<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>({ styles, ...props }: Props<Option, IsMulti, Group>) {
  return (
    <ReactSelect<Option, IsMulti, Group>
      {...props}
      styles={{ ...adminSelectStyles<Option, IsMulti, Group>(), ...styles }}
    />
  );
}
