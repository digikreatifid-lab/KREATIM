import { describe, expect, it } from "vitest";
import { buildObjectKey, isKreatimR2Url } from "@/lib/r2";

const BASE = "https://cdn.kreatim.id";

describe("isKreatimR2Url", () => {
  it("menerima URL R2 milik user", () => {
    expect(isKreatimR2Url(`${BASE}/users/u1/logos/a.png`, "u1", BASE)).toBe(true);
    expect(isKreatimR2Url(`${BASE}/users/u1/logos/a.png`, undefined, BASE)).toBe(true);
  });

  it("menolak domain lain, http, path traversal, query, dan folder user lain", () => {
    expect(isKreatimR2Url("https://evil.com/users/u1/a.png", "u1", BASE)).toBe(false);
    expect(isKreatimR2Url("http://cdn.kreatim.id/users/u1/a.png", "u1", BASE)).toBe(false);
    expect(isKreatimR2Url(`${BASE}.evil.com/users/u1/a.png`, "u1", BASE)).toBe(false);
    expect(isKreatimR2Url(`${BASE}/users/u2/a.png`, "u1", BASE)).toBe(false);
    expect(isKreatimR2Url(`${BASE}/users/u1/%2e%2e/u2/a.png`, "u1", BASE)).toBe(false);
    expect(isKreatimR2Url(`${BASE}/users/u1/a.png?x=1`, "u1", BASE)).toBe(false);
    expect(isKreatimR2Url(`https://user:pw@cdn.kreatim.id/users/u1/a.png`, "u1", BASE)).toBe(false);
    expect(isKreatimR2Url(`${BASE}/other/a.png`, undefined, BASE)).toBe(false);
    expect(isKreatimR2Url("not a url", undefined, BASE)).toBe(false);
    expect(isKreatimR2Url(`${BASE}/users/u1/a.png`, "u1", undefined)).toBe(false);
  });
});

describe("buildObjectKey", () => {
  it("selalu berada di folder user dengan ekstensi sesuai tipe", () => {
    expect(buildObjectKey("abc123", "logos", "image/png")).toMatch(/^users\/abc123\/logos\/[0-9a-f-]{36}\.png$/);
    expect(buildObjectKey("abc123", "products", "image/jpeg")).toMatch(/\.jpg$/);
  });

  it("menolak userId yang tidak aman", () => {
    expect(() => buildObjectKey("../x", "logos", "image/png")).toThrow();
  });
});
