import { describe, test, expect } from "bun:test";
import { sanitizeTextForTwitter, formatResetTime } from "./share-to-x";

describe("sanitizeTextForTwitter", () => {
  describe("Markdown Bold Removal", () => {
    test("should remove closed bold markers (**text**)", () => {
      const input = "This is **bold** text";
      const expected = "This is bold text";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should remove unclosed bold markers (**text)", () => {
      const input = "This is **bold text without closing";
      const expected = "This is bold text without closing";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should remove closed bold markers with underscores (__text__)", () => {
      const input = "This is __bold__ text";
      const expected = "This is bold text";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should remove unclosed bold markers with underscores (__text)", () => {
      const input = "This is __bold text without closing";
      const expected = "This is bold text without closing";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should handle multiple bold markers", () => {
      const input = "**First** bold and **second** bold";
      const expected = "First bold and second bold";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });
  });

  describe("Markdown Italic Removal", () => {
    test("should remove closed italic markers (*text*)", () => {
      const input = "This is *italic* text";
      const expected = "This is italic text";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should remove unclosed italic markers (*text)", () => {
      const input = "This is *italic text without closing";
      const expected = "This is italic text without closing";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should remove closed italic markers with underscores (_text_)", () => {
      const input = "This is _italic_ text";
      const expected = "This is italic text";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should remove unclosed italic markers with underscores (_text)", () => {
      const input = "This is _italic text without closing";
      const expected = "This is italic text without closing";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });
  });

  describe("Real-world Bug Case", () => {
    test("should remove unclosed bold markers from indicator metadata", () => {
      const input = `Reversal Point)
- **Confidence:** 67%
- **Strength:** HIGH - Tested 1 time
- **Last Test:** Yesterday <span class="timestamp-utc" data-timestamp="1760216400000">(loading time...)</span>
- **Visual:** Dashed line with diamond markers
- **Note:** Major reversal point`;

      const expected = `Reversal Point)
- Confidence: 67%
- Strength: HIGH - Tested 1 time
- Last Test: Yesterday (loading time...)
- Visual: Dashed line with diamond markers
- Note: Major reversal point`;

      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should handle field labels with unclosed bold markers", () => {
      const input = "**Label:** Value here";
      const expected = "Label: Value here";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });
  });

  describe("HTML Tag Removal", () => {
    test("should remove HTML tags", () => {
      const input = "This is <strong>bold</strong> text";
      const expected = "This is bold text";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should remove complex HTML tags", () => {
      const input =
        '<span class="timestamp-utc" data-timestamp="1234567890">Text</span>';
      const expected = "Text";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should remove self-closing HTML tags", () => {
      const input = "Text with <br/> line break";
      const expected = "Text with line break";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });
  });

  describe("Code Block Removal", () => {
    test("should remove code blocks with backticks", () => {
      const input = "Text before ```code block``` text after";
      const expected = "Text before text after";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should remove inline code", () => {
      const input = "Text with `inline code` here";
      const expected = "Text with inline code here";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should remove multi-line code blocks", () => {
      const input = `Text before
\`\`\`
function test() {
  return true;
}
\`\`\`
text after`;
      const expected = "Text before\n\ntext after";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });
  });

  describe("Markdown Headers", () => {
    test("should remove header markers", () => {
      const input = "# Header 1";
      const expected = "Header 1";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should remove multi-level headers", () => {
      const input = "## Header 2\n### Header 3";
      const expected = "Header 2\nHeader 3";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });
  });

  describe("Markdown Links and Images", () => {
    test("should remove markdown links but keep text", () => {
      const input = "Check [this link](https://example.com) out";
      const expected = "Check this link out";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should remove markdown images", () => {
      const input = "Image here: ![alt text](https://example.com/image.png)";
      const expected = "Image here:";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });
  });

  describe("Whitespace Normalization", () => {
    test("should normalize multiple spaces to single space", () => {
      const input = "Text  with   multiple    spaces";
      const expected = "Text with multiple spaces";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should normalize multiple newlines", () => {
      const input = "Text\n\n\n\nwith many newlines";
      const expected = "Text\n\nwith many newlines";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should trim leading and trailing whitespace", () => {
      const input = "  \n  Text with whitespace  \n  ";
      const expected = "Text with whitespace";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });
  });

  describe("Complex Mixed Markdown", () => {
    test("should handle mixed markdown and HTML", () => {
      const input =
        "**Bold** and *italic* with <strong>HTML</strong> and `code`";
      const expected = "Bold and italic with HTML and code";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should handle nested and complex formatting", () => {
      const input = `# Title
**Bold text** with _italic_ and \`code\`
- List item with **unclosed bold
[Link](https://example.com)
<div>HTML content</div>`;

      const expected = `Title
Bold text with italic and code
- List item with unclosed bold
Link
HTML content`;

      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty string", () => {
      const input = "";
      const expected = "";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should handle only whitespace", () => {
      const input = "   \n\n   ";
      const expected = "";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should handle text with no markdown", () => {
      const input = "Plain text with no formatting";
      const expected = "Plain text with no formatting";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should handle only markdown markers", () => {
      const input = "** __ * _";
      const expected = "";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });

    test("should handle multiline bold text", () => {
      const input = "**Text that\nspans multiple\nlines**";
      const expected = "Text that\nspans multiple\nlines";
      expect(sanitizeTextForTwitter(input)).toBe(expected);
    });
  });
});

describe("formatResetTime", () => {
  test("should return 'now' for timestamps in the past", () => {
    const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    expect(formatResetTime(pastTimestamp)).toBe("now");
  });

  test("should format minutes correctly", () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 600; // 10 minutes from now
    const result = formatResetTime(futureTimestamp);
    expect(result).toMatch(/^\d+ minutes?$/);
    expect(result).toContain("minute");
  });

  test("should format hours and minutes correctly", () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 7500; // ~2 hours from now
    const result = formatResetTime(futureTimestamp);
    expect(result).toMatch(/^\d+ hours? and \d+ minutes?$/);
    expect(result).toContain("hour");
  });

  test("should handle 24-hour rate limit reset (typical Twitter case)", () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
    const result = formatResetTime(futureTimestamp);
    expect(result).toContain("23 hours"); // Accounts for timing differences
    expect(result).toContain("minute");
  });

  test("should include 'hour' for longer durations", () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 18000; // 5 hours from now
    const result = formatResetTime(futureTimestamp);
    expect(result).toContain("hour");
    expect(result).toContain("and");
  });

  test("should format realistic Twitter rate limit reset", () => {
    // Twitter typically shows reset times up to 24 hours away
    const futureTimestamp = Math.floor(Date.now() / 1000) + 50400; // ~14 hours from now
    const result = formatResetTime(futureTimestamp);
    expect(result).toMatch(/\d+ hours? and \d+ minutes?/);
  });
});
