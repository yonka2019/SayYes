import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/i18n/locales";
import { answeredEmail, createdEmail } from "@/lib/mail/content";

const created = {
  recipientName: "Maya",
  mascot: "BEAR" as const,
  link: "https://sayyes.fun/en/invite/abc123",
};

const answered = {
  recipientName: "Maya",
  mascot: "PENGUIN" as const,
  link: "https://sayyes.fun/en/answers/abc123",
  recap: [
    { question: "Where?", answer: "Sushi" },
    { question: "When?", answer: "Friday" },
  ],
};

describe("createdEmail", () => {
  it("interpolates the recipient name and link into every part, in every locale", () => {
    for (const locale of LOCALES) {
      const { subject, text, html } = createdEmail({ locale, ...created });
      expect(subject).toContain("Maya");
      expect(text).toContain("Maya");
      expect(text).toContain(created.link);
      expect(html).toContain("Maya");
      expect(html).toContain(created.link);
    }
  });

  it("never leaves a literal placeholder token behind", () => {
    for (const locale of LOCALES) {
      const { subject, text, html } = createdEmail({ locale, ...created });
      expect(subject).not.toMatch(/\{\w+\}/);
      expect(text).not.toMatch(/\{\w+\}/);
      expect(html).not.toMatch(/\{\w+\}/);
    }
  });

  it("uses the chosen mascot's emoji in the header", () => {
    expect(createdEmail({ locale: "en", ...created }).html).toContain("🐻");
    expect(createdEmail({ locale: "en", ...created, mascot: "FOX" }).html).toContain("🦊");
  });

  it("renders Hebrew mail right-to-left", () => {
    expect(createdEmail({ locale: "he", ...created }).html).toContain('dir="rtl"');
    expect(createdEmail({ locale: "en", ...created }).html).toContain('dir="ltr"');
  });

  it("escapes a recipient name that contains markup", () => {
    const { html } = createdEmail({ locale: "en", ...created, recipientName: "<b>M</b>" });
    expect(html).toContain("&lt;b&gt;M&lt;/b&gt;");
    expect(html).not.toContain("<b>M</b>");
  });

  it("offers the raw link as copyable text, not only as a button", () => {
    const { html } = createdEmail({ locale: "en", ...created });
    expect(html).toContain("Or copy the link:");
    // Once in the button href, once as visible text.
    expect(html.split(created.link).length - 1).toBeGreaterThanOrEqual(2);
  });
});

describe("answeredEmail", () => {
  it("interpolates the recipient name and answers link, in every locale", () => {
    for (const locale of LOCALES) {
      const { subject, text, html } = answeredEmail({ locale, ...answered });
      expect(subject).toContain("Maya");
      expect(text).toContain("Maya");
      expect(text).toContain(answered.link);
      expect(html).toContain("Maya");
      expect(html).toContain(answered.link);
    }
  });

  it("never leaves a literal placeholder token behind", () => {
    for (const locale of LOCALES) {
      const { subject, text, html } = answeredEmail({ locale, ...answered });
      expect(subject).not.toMatch(/\{\w+\}/);
      expect(text).not.toMatch(/\{\w+\}/);
      expect(html).not.toMatch(/\{\w+\}/);
    }
  });

  // Reverses the earlier "heads-up and link only" rule: the creator should not
  // have to click through to find out what was picked.
  it("puts the recap in the html part", () => {
    const { html } = answeredEmail({ locale: "en", ...answered });
    expect(html).toContain("Where?");
    expect(html).toContain("Sushi");
    expect(html).toContain("When?");
    expect(html).toContain("Friday");
  });

  it("puts the recap in the plain-text part too, so text-only clients see it", () => {
    const { text } = answeredEmail({ locale: "en", ...answered });
    expect(text).toContain("Where?");
    expect(text).toContain("Sushi");
    expect(text).toContain("When?");
    expect(text).toContain("Friday");
  });

  it("escapes creator-typed questions and answers in the html", () => {
    const { html } = answeredEmail({
      locale: "en",
      ...answered,
      recap: [{ question: "<i>q</i>", answer: "Tom & Jerry" }],
    });
    expect(html).toContain("&lt;i&gt;q&lt;/i&gt;");
    expect(html).toContain("Tom &amp; Jerry");
    expect(html).not.toContain("<i>q</i>");
  });

  it("still renders with no answers at all", () => {
    const { html, text } = answeredEmail({ locale: "en", ...answered, recap: [] });
    expect(html).toContain("Maya");
    expect(text).toContain("Maya");
  });

  it("lays the recap out for the reading direction of the locale", () => {
    expect(answeredEmail({ locale: "he", ...answered }).html).toContain('align="left"');
    expect(answeredEmail({ locale: "en", ...answered }).html).toContain('align="right"');
  });

  it("genders the verbs for the recipient, defaulting to her", () => {
    expect(answeredEmail({ locale: "ru", ...answered }).subject).toContain("ответила на");
    expect(answeredEmail({ locale: "ru", ...answered, gender: "HE" }).subject).toContain(
      "ответил на"
    );
    expect(answeredEmail({ locale: "he", ...answered, gender: "HE" }).subject).toContain(
      "ענה על"
    );
    expect(createdEmail({ locale: "en", ...created, gender: "HE" }).html).toContain(
      "Send him the link"
    );
  });
});
