import { describe, expect, it } from "vitest";

import { toCsv } from "./csv";

describe("toCsv", () => {
  it("escapa separadores y comillas", () => {
    expect(toCsv([{ a: 'x;"y"', b: null }])).toBe('a;b\r\n"x;""y""";');
  });
  it("serializa objetos como JSON", () => {
    expect(toCsv([{ v: { k: 1 } }])).toBe('v\r\n"{""k"":1}"');
  });
});
