import { describe, expect, it, vi } from "vitest";

import {
  createDomainDeploymentProvider,
  DomainProviderError,
  VercelDomainDeploymentProvider,
} from "./domain-deployment-provider";

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

describe("VercelDomainDeploymentProvider", () => {
  it("attaches to the configured project and reports provider-derived DNS guidance", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ verified: false }))
      .mockResolvedValueOnce(
        response({
          verification: [{ domain: "_vercel.menu.example", type: "TXT", value: "proof" }],
          verified: false,
        }),
      )
      .mockResolvedValueOnce(
        response({
          misconfigured: true,
          recommendedCNAME: [{ rank: 1, value: "tenant.vercel-dns-1.com" }],
          recommendedIPv4: [],
        }),
      );
    const provider = new VercelDomainDeploymentProvider({
      apiToken: "secret",
      fetcher,
      projectId: "prj_rest",
      teamId: "team_darb",
    });

    await expect(provider.connect("menu.example")).resolves.toEqual({
      state: "needs-configuration",
      dnsRecords: [
        { name: "_vercel.menu.example", type: "TXT", value: "proof" },
        { name: "menu.example", type: "CNAME", value: "tenant.vercel-dns-1.com" },
      ],
    });
    expect(fetcher.mock.calls[0]?.[0]).toContain("/v10/projects/prj_rest/domains?teamId=team_darb");
    expect(fetcher.mock.calls[0]?.[1]?.headers).toEqual({
      Authorization: "Bearer secret",
      "Content-Type": "application/json",
    });
  });

  it("requires both project verification and deployable DNS before reporting live", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ verified: true }))
      .mockResolvedValueOnce(
        response({ misconfigured: false, recommendedCNAME: [], recommendedIPv4: [] }),
      );
    const provider = new VercelDomainDeploymentProvider({
      apiToken: "secret",
      fetcher,
      projectId: "prj_rest",
    });
    await expect(provider.status("menu.example")).resolves.toEqual({
      state: "live",
      dnsRecords: [],
    });
  });

  it("treats an already attached project domain as an idempotent connect", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ error: { code: "not_modified" } }, 400))
      .mockResolvedValueOnce(response({ verified: true }))
      .mockResolvedValueOnce(response({ misconfigured: false }));
    const provider = new VercelDomainDeploymentProvider({
      apiToken: "secret",
      fetcher,
      projectId: "prj_rest",
    });

    await expect(provider.connect("menu.example")).resolves.toMatchObject({ state: "live" });
  });

  it("distinguishes a domain unavailable to this project after connect rejection", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ error: { code: "domain_already_in_use" } }, 400))
      .mockResolvedValueOnce(response({}, 404))
      .mockResolvedValueOnce(response({ misconfigured: true }));
    const provider = new VercelDomainDeploymentProvider({
      apiToken: "secret",
      fetcher,
      projectId: "prj_rest",
    });

    await expect(provider.connect("menu.example")).rejects.toMatchObject({
      safeCode: "already-assigned",
    });
  });

  it("maps provider authorization, timeout, and server failures to safe codes", async () => {
    const forbidden = new VercelDomainDeploymentProvider({
      apiToken: "secret",
      fetcher: vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(response({}, 403))
        .mockResolvedValueOnce(response({ misconfigured: true })),
      projectId: "prj_rest",
    });
    await expect(forbidden.status("menu.example")).rejects.toMatchObject({
      safeCode: "forbidden",
    });

    const timeout = new VercelDomainDeploymentProvider({
      apiToken: "secret",
      fetcher: vi.fn<typeof fetch>().mockRejectedValue(new Error("timeout details")),
      projectId: "prj_rest",
    });
    await expect(timeout.status("menu.example")).rejects.toMatchObject({
      safeCode: "provider-unavailable",
    });

    const unavailable = new VercelDomainDeploymentProvider({
      apiToken: "secret",
      fetcher: vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(response({}, 503))
        .mockResolvedValueOnce(response({ misconfigured: true })),
      projectId: "prj_rest",
    });
    await expect(unavailable.status("menu.example")).rejects.toMatchObject({
      safeCode: "provider-unavailable",
    });
  });

  it("rejects malformed successful provider responses", async () => {
    const provider = new VercelDomainDeploymentProvider({
      apiToken: "secret",
      fetcher: vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response("not-json", { status: 200 }))
        .mockResolvedValueOnce(response({ misconfigured: false })),
      projectId: "prj_rest",
    });
    await expect(provider.status("menu.example")).rejects.toMatchObject({
      safeCode: "provider-unavailable",
    });
  });

  it("supports successful and already-absent disconnects", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(response({}, 404));
    const provider = new VercelDomainDeploymentProvider({
      apiToken: "secret",
      fetcher,
      projectId: "prj_rest",
    });
    await expect(provider.disconnect("menu.example")).resolves.toBeUndefined();
    await expect(provider.disconnect("menu.example")).resolves.toBeUndefined();
  });

  it("fails a provider disconnect safely", async () => {
    const provider = new VercelDomainDeploymentProvider({
      apiToken: "secret",
      fetcher: vi.fn<typeof fetch>().mockResolvedValue(response({}, 500)),
      projectId: "prj_rest",
    });
    await expect(provider.disconnect("menu.example")).rejects.toMatchObject({
      safeCode: "provider-unavailable",
    });
  });
});

describe("createDomainDeploymentProvider", () => {
  it("allows an explicit fake only outside production", async () => {
    const provider = createDomainDeploymentProvider({
      DARB_DOMAIN_PROVIDER: "fake",
      DARB_FAKE_DOMAIN_PROVIDER_STATE: "live",
      NODE_ENV: "test",
    });
    await expect(provider.status("menu.example")).resolves.toMatchObject({ state: "live" });
  });

  it("fails closed when production credentials are absent or fake mode is requested", () => {
    expect(() => createDomainDeploymentProvider({ NODE_ENV: "production" })).toThrow(
      DomainProviderError,
    );
    expect(() =>
      createDomainDeploymentProvider({ DARB_DOMAIN_PROVIDER: "fake", NODE_ENV: "production" }),
    ).toThrow(DomainProviderError);
  });
});
