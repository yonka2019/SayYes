import { describe, expect, it } from "vitest";
import { MASCOT_EMOJI, MASCOT_KINDS, MASCOT_NAME_KEY } from "@/lib/mascots";
import { getDictionary } from "@/lib/i18n/t";
import { LOCALES } from "@/lib/i18n/locales";

describe("mascot registry", () => {
  it("gives every kind a name key and an emoji", () => {
    for (const kind of MASCOT_KINDS) {
      expect(MASCOT_NAME_KEY[kind]).toBeTruthy();
      expect(MASCOT_EMOJI[kind]).toBeTruthy();
    }
  });

  it("has no entries beyond MASCOT_KINDS", () => {
    // Guards the reverse direction: a key map that drifts ahead of the list.
    expect(Object.keys(MASCOT_NAME_KEY).sort()).toEqual([...MASCOT_KINDS].sort());
    expect(Object.keys(MASCOT_EMOJI).sort()).toEqual([...MASCOT_KINDS].sort());
  });

  it("resolves every name key to a real string in every locale", () => {
    for (const locale of LOCALES) {
      const dict = getDictionary(locale);
      for (const kind of MASCOT_KINDS) {
        expect(dict[MASCOT_NAME_KEY[kind]]).toBeTruthy();
      }
    }
  });
});
