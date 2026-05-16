import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchRegistryPackageMeta } from "../../src/registry/npm";

const originalFetch = globalThis.fetch;
type FetchMock = typeof fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("fetchRegistryPackageMeta", () => {
  it("requests the npm registry with redirect blocking and a timeout signal", async () => {
    const fetchMock = vi.fn<FetchMock>().mockResolvedValue(
      new Response(
        JSON.stringify({
          name: "react",
          time: { "18.3.1": "2026-04-20T00:00:00.000Z" },
          versions: { "18.3.1": {} },
          "dist-tags": { latest: "18.3.1" },
        }),
        { status: 200 },
      ),
    );

    globalThis.fetch = fetchMock as typeof fetch;

    const result = await fetchRegistryPackageMeta("react");

    expect(result).toMatchObject({
      latestVersion: "18.3.1",
      name: "react",
    });
    expect(result.versions).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith("https://registry.npmjs.org/react", {
      redirect: "error",
      signal: expect.any(AbortSignal),
    });
  });

  it("skips versions with invalid publish timestamps", async () => {
    globalThis.fetch = vi.fn<FetchMock>().mockResolvedValue(
      new Response(
        JSON.stringify({
          name: "react",
          time: {
            "18.3.2": "not-a-date",
            "18.3.1": "2026-04-20T00:00:00.000Z",
          },
          versions: {
            "18.3.2": {},
            "18.3.1": {},
          },
        }),
        { status: 200 },
      ),
    ) as typeof fetch;

    const result = await fetchRegistryPackageMeta("react");

    expect(result.versions.map((entry) => entry.version)).toEqual(["18.3.1"]);
  });

  it("rejects non-object packument payloads", async () => {
    globalThis.fetch = vi
      .fn<FetchMock>()
      .mockResolvedValue(new Response("[]", { status: 200 })) as typeof fetch;

    await expect(fetchRegistryPackageMeta("react")).rejects.toThrow(
      "npm registry returned an invalid packument payload",
    );
  });

  it("identifies the package when the packument exceeds the safety limit", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(101 * 1024 * 1024));
        controller.close();
      },
    });

    globalThis.fetch = vi
      .fn<FetchMock>()
      .mockResolvedValue(new Response(stream, { status: 200 })) as typeof fetch;

    await expect(fetchRegistryPackageMeta("large-package")).rejects.toThrow(
      "npm registry response for large-package exceeded the 100 MiB safety limit. To allow a larger response, rerun with --max-registry-mib <mib>.",
    );
  });

  it("allows callers to raise the packument safety limit", async () => {
    const payload = JSON.stringify({
      name: "large-package",
      time: { "1.0.0": "2026-04-20T00:00:00.000Z" },
      versions: { "1.0.0": {} },
    });

    globalThis.fetch = vi
      .fn<FetchMock>()
      .mockResolvedValue(new Response(payload, { status: 200 })) as typeof fetch;

    const result = await fetchRegistryPackageMeta("large-package", {
      maxResponseMiB: 256,
    });

    expect(result.versions.map((entry) => entry.version)).toEqual(["1.0.0"]);
  });
});
