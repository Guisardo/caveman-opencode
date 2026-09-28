import { describe, it, expect } from "vitest";
import { validateOptions, isValidLevel } from "../options-validator.js";

describe("validateOptions", () => {
  it("returns defaults for invalid input", () => {
    expect(validateOptions(null)).toEqual({ defaultLevel: "full", enabled: true });
    expect(validateOptions(undefined)).toEqual({ defaultLevel: "full", enabled: true });
    expect(validateOptions({})).toEqual({ defaultLevel: "full", enabled: true });
    expect(validateOptions("not an object")).toEqual({ defaultLevel: "full", enabled: true });
  });

  it("validates known level", () => {
    expect(validateOptions({ defaultLevel: "lite" }).defaultLevel).toBe("lite");
    expect(validateOptions({ defaultLevel: "full" }).defaultLevel).toBe("full");
    expect(validateOptions({ defaultLevel: "ultra" }).defaultLevel).toBe("ultra");
    expect(validateOptions({ defaultLevel: "wenyan" }).defaultLevel).toBe("wenyan");
    expect(validateOptions({ defaultLevel: "wenyan-lite" }).defaultLevel).toBe("wenyan-lite");
    expect(validateOptions({ defaultLevel: "wenyan-ultra" }).defaultLevel).toBe("wenyan-ultra");
  });

  it("falls back for unknown level", () => {
    expect(validateOptions({ defaultLevel: "invalid" }).defaultLevel).toBe("full");
    expect(validateOptions({ defaultLevel: "medium" }).defaultLevel).toBe("full");
    expect(validateOptions({ defaultLevel: 123 }).defaultLevel).toBe("full");
  });

  it("validates enabled flag", () => {
    expect(validateOptions({ enabled: true }).enabled).toBe(true);
    expect(validateOptions({ enabled: false }).enabled).toBe(false);
    expect(validateOptions({ enabled: "true" }).enabled).toBe(true);
    expect(validateOptions({ enabled: 1 }).enabled).toBe(true);
  });

  it("combines options correctly", () => {
    const result = validateOptions({ defaultLevel: "ultra", enabled: false });
    expect(result).toEqual({ defaultLevel: "ultra", enabled: false });
  });
});

describe("isValidLevel", () => {
  it("accepts all valid levels", () => {
    expect(isValidLevel("lite")).toBe(true);
    expect(isValidLevel("full")).toBe(true);
    expect(isValidLevel("ultra")).toBe(true);
    expect(isValidLevel("wenyan")).toBe(true);
    expect(isValidLevel("wenyan-lite")).toBe(true);
    expect(isValidLevel("wenyan-ultra")).toBe(true);
  });

  it("rejects invalid levels", () => {
    expect(isValidLevel("invalid")).toBe(false);
    expect(isValidLevel("medium")).toBe(false);
    expect(isValidLevel("")).toBe(false);
    expect(isValidLevel("LITE")).toBe(false);
  });
});