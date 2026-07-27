import { describe, expect, it } from "vitest";
import {
  button,
  emailShell,
  escapeHtml,
  footer,
  linkFallback,
  recapTable,
} from "@/lib/mail/layout";

describe("escapeHtml", () => {
  it("escapes every character that could break out of markup", () => {
    expect(escapeHtml(`<script>alert("x")&'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&amp;&#39;"
    );
  });

  it("leaves ordinary text alone, including non-Latin scripts", () => {
    expect(escapeHtml("מאיה")).toBe("מאיה");
    expect(escapeHtml("Маша")).toBe("Маша");
  });

  it("escapes the ampersand too, so an escape sequence is not mistaken for markup", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });
});

describe("emailShell", () => {
  it("marks Hebrew mail as RTL and the others as LTR", () => {
    expect(emailShell({ locale: "he", preheader: "p", headerEmoji: "🐻", body: "" })).toContain(
      'dir="rtl"'
    );
    for (const locale of ["ru", "en"] as const) {
      expect(emailShell({ locale, preheader: "p", headerEmoji: "🐻", body: "" })).toContain(
        'dir="ltr"'
      );
    }
  });

  it("includes the preheader, the emoji and the body", () => {
    const html = emailShell({
      locale: "en",
      preheader: "inbox teaser",
      headerEmoji: "🐧",
      body: "<p>hello</p>",
    });
    expect(html).toContain("inbox teaser");
    expect(html).toContain("<p>hello</p>");
    expect(html).toContain("🐧");
  });

  it("gives Outlook a solid header colour alongside the gradient", () => {
    const html = emailShell({ locale: "en", preheader: "p", headerEmoji: "🐻", body: "" });
    expect(html).toContain('bgcolor="#E84A7F"');
    expect(html).toContain("linear-gradient");
  });

  it("escapes the preheader", () => {
    const html = emailShell({
      locale: "en",
      preheader: "<b>x</b>",
      headerEmoji: "🐻",
      body: "",
    });
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(html).not.toContain("<b>x</b>");
  });

  it("does not load a webfont, since mail clients would not honour it", () => {
    const html = emailShell({ locale: "en", preheader: "p", headerEmoji: "🐻", body: "" });
    expect(html).not.toContain("@font-face");
    expect(html).not.toContain("fonts.googleapis");
  });
});

describe("button", () => {
  it("renders a table-based link with the href and label", () => {
    const html = button({ href: "https://sayyes.fun/en", label: "See the answers" });
    expect(html).toContain('href="https://sayyes.fun/en"');
    expect(html).toContain("See the answers");
    expect(html).toContain("<table");
  });

  it("escapes the label and the href", () => {
    const html = button({ href: "https://x.test/?a=1&b=2", label: "<b>go</b>" });
    expect(html).toContain("&amp;b=2");
    expect(html).toContain("&lt;b&gt;go&lt;/b&gt;");
  });
});

describe("recapTable", () => {
  it("renders one row per item with the question and the answer", () => {
    const html = recapTable({
      items: [
        { question: "Where?", answer: "Sushi" },
        { question: "When?", answer: "Friday" },
      ],
      dir: "ltr",
    });
    expect(html).toContain("Where?");
    expect(html).toContain("Sushi");
    expect(html).toContain("When?");
    expect(html).toContain("Friday");
    // Two items x two cells, each cell carrying the row's rounded corner.
    expect(html.match(/border-radius:14px/g)).toHaveLength(4);
  });

  it("escapes creator-typed questions and answers", () => {
    const html = recapTable({
      items: [{ question: "<img src=x>", answer: "Tom & Jerry" }],
      dir: "ltr",
    });
    expect(html).toContain("&lt;img src=x&gt;");
    expect(html).toContain("Tom &amp; Jerry");
    expect(html).not.toContain("<img src=x>");
  });

  it("aligns the answer to the opposite edge in RTL", () => {
    expect(recapTable({ items: [{ question: "q", answer: "a" }], dir: "rtl" })).toContain(
      'align="left"'
    );
    expect(recapTable({ items: [{ question: "q", answer: "a" }], dir: "ltr" })).toContain(
      'align="right"'
    );
  });

  it("renders nothing for an empty list, so callers can concatenate blindly", () => {
    expect(recapTable({ items: [], dir: "ltr" })).toBe("");
  });
});

describe("linkFallback", () => {
  it("shows the raw url as copyable text", () => {
    const html = linkFallback({ hint: "Or copy the link:", href: "https://sayyes.fun/en/x" });
    expect(html).toContain("Or copy the link:");
    expect(html).toContain("https://sayyes.fun/en/x");
  });
});

describe("footer", () => {
  it("escapes its text", () => {
    expect(footer("a & b")).toContain("a &amp; b");
  });
});
