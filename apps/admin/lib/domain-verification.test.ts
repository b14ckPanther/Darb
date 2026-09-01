import { describe, expect, it } from "vitest";

import { mapDnsTxtRecords, verifyDomainDnsTxt } from "./domain-verification";

describe("DNS TXT verification", () => {
  it("matches only the exact TXT value after joining DNS chunks", () => {
    expect(mapDnsTxtRecords([["darb-verification=", "token"]], "darb-verification=token")).toEqual({
      status: "verified",
    });
    expect(
      mapDnsTxtRecords([["prefix-darb-verification=token"]], "darb-verification=token"),
    ).toEqual({
      status: "not-found",
    });
  });

  it("uses an injectable resolver without public DNS propagation", async () => {
    const requestedNames: string[] = [];
    const result = await verifyDomainDnsTxt("www.example.com", "token", async (hostname) => {
      requestedNames.push(hostname);
      return [["darb-verification=token"]];
    });

    expect(requestedNames).toEqual(["_darb-verification.www.example.com"]);
    expect(result).toEqual({ status: "verified" });
  });

  it("distinguishes authoritative absence from temporary resolver failure", async () => {
    const absent = await verifyDomainDnsTxt("missing.example", "token", async () => {
      throw Object.assign(new Error("not found"), { code: "ENOTFOUND" });
    });
    const temporary = await verifyDomainDnsTxt(
      "slow.example",
      "token",
      async () => {
        await new Promise(() => undefined);
        return [];
      },
      1,
    );

    expect(absent).toEqual({ status: "not-found" });
    expect(temporary).toEqual({ status: "temporary-error" });
  });
});
