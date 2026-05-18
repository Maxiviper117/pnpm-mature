import { describe, expect, it } from "vitest";

import { sanitizeTerminalText } from "../../src/utils/terminal";

describe("sanitizeTerminalText", () => {
  it("strips ANSI escape sequences from untrusted output", () => {
    expect(sanitizeTerminalText("1.0.0\u001b[2J\u001b[Hfake")).toBe("1.0.0fake");
    expect(sanitizeTerminalText("\u001b[31mred\u001b[0m")).toBe("red");
  });
});
