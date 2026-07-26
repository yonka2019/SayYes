import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/i18n/locales";
import { createdEmail, answeredEmail } from "@/lib/mail/content";

const params = {
  recipientName: "Maya",
  link: "https://sayyes.fun/en/invite/abc123",
};

describe("createdEmail", () => {
  it("interpolates the recipient name and link in every locale", () => {
    for (const locale of LOCALES) {
      const { subject, text } = createdEmail({ locale, ...params });
      expect(subject).toContain("Maya");
      expect(text).toContain("Maya");
      expect(text).toContain(params.link);
    }
  });

  it("never leaves a literal placeholder token behind", () => {
    for (const locale of LOCALES) {
      const { subject, text } = createdEmail({ locale, ...params });
      expect(subject).not.toMatch(/\{\w+\}/);
      expect(text).not.toMatch(/\{\w+\}/);
    }
  });
});

describe("answeredEmail", () => {
  it("interpolates the recipient name and dashboard link in every locale", () => {
    for (const locale of LOCALES) {
      const { subject, text } = answeredEmail({ locale, ...params });
      expect(subject).toContain("Maya");
      expect(text).toContain("Maya");
      expect(text).toContain(params.link);
    }
  });

  it("never leaves a literal placeholder token behind", () => {
    for (const locale of LOCALES) {
      const { subject, text } = answeredEmail({ locale, ...params });
      expect(subject).not.toMatch(/\{\w+\}/);
      expect(text).not.toMatch(/\{\w+\}/);
    }
  });

  it("does not include a per-question recap — just the heads-up and link", () => {
    for (const locale of LOCALES) {
      const { text } = answeredEmail({ locale, ...params });
      expect(text).not.toMatch(/Sushi|Pizza/);
    }
  });
});
