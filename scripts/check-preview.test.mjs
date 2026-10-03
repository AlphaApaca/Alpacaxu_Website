import assert from "node:assert/strict";
import test from "node:test";
import { articlePathFromManifest, assertPage, checkPreview, hasRobotsNoindex, resolveGithubPreview, validateArticlePath, validatePreviewUrl } from "./check-preview.mjs";

const PREVIEW = "https://blogofalpaca-git-codex-astro-migration-alpacaxus-projects.vercel.app/";
const IMMUTABLE_PREVIEW = "https://blogofalpaca-1i2ud0dkj-alpacaxus-projects.vercel.app/";
const normalHtml = '<html><body><main><h1>Website</h1></main></body></html>';
const missingHtml = '<html data-page="not-found"><head><meta content="noindex, nofollow" name="robots"></head><body><main>404</main></body></html>';
const response = (status, html, headers = {}) => new Response(html, {
  status,
  headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex", ...headers },
});

test("preview allowlist accepts deployment and branch aliases only for this project", () => {
  assert.equal(validatePreviewUrl(PREVIEW).origin, PREVIEW.slice(0, -1));
  validatePreviewUrl("https://blogofalpaca-1i2ud0dkj-alpacaxus-projects.vercel.app");
  for (const value of [
    "http://blogofalpaca-test-alpacaxus-projects.vercel.app/", "https://www.alpacaxu.cn/",
    "https://otherproject-test-alpacaxus-projects.vercel.app/", "https://127.0.0.1/",
    "https://blogofalpaca-test-alpacaxus-projects.vercel.app.attacker.example/",
    "https://user:password@blogofalpaca-test-alpacaxus-projects.vercel.app/",
    "https://blogofalpaca-test-alpacaxus-projects.vercel.app:8443/", `${PREVIEW}writing/`, `${PREVIEW}?token=secret`, `${PREVIEW}#posts`,
  ]) assert.throws(() => validatePreviewUrl(value));
});

test("article path is local and cannot select an arbitrary network target", () => {
  validateArticlePath("/writing/2026-10-02-datasets-and-dataloaders/");
  for (const value of ["//attacker.example/", "/writing/../admin/", "/writing/a/?token=x", "/writing/UPPERCASE/"]) {
    assert.throws(() => validateArticlePath(value));
  }
});

test("preview routes follow the deployed snapshot, including an empty writing collection", async () => {
  const manifest = { sourceRepo: "AlphaApaca/repytorch", sourceCommit: "a".repeat(40), articles: [{ permalink: "new-note" }] };
  assert.equal(articlePathFromManifest(manifest), "/writing/new-note/");
  assert.equal(articlePathFromManifest({ ...manifest, articles: [] }), null);
  assert.throws(() => articlePathFromManifest({ ...manifest, articles: [{ permalink: "../admin" }] }), /valid repytorch/);
  assert.throws(() => articlePathFromManifest({ ...manifest, sourceCommit: "main" }), /valid repytorch/);
  const paths = [];
  await checkPreview(PREVIEW, {
    articlePath: null,
    includeAbout: true,
    fetchImpl: async (url) => {
      paths.push(url.pathname);
      return url.pathname.includes("missing-page") ? response(404, missingHtml) : response(200, normalHtml);
    },
    report: () => {},
  });
  assert.deepEqual(paths, ["/", "/writing/", "/about/", "/__preview-acceptance-missing-page__-9f97b37a/"]);
});

test("robots metadata supports attribute order, case, and quoting variations", () => {
  assert.equal(hasRobotsNoindex('<META CONTENT=noindex NAME=robots>'), true);
  assert.equal(hasRobotsNoindex("<meta name='robots' content='nofollow, noindex'>"), true);
  assert.equal(hasRobotsNoindex('<meta name="robots" content="index">'), false);
});

test("soft 404, platform 404, missing robots and access-protected pages fail", () => {
  const base = { pathname: "/missing/", expectedStatus: 404, custom404: true };
  assert.throws(() => assertPage({ ...base, response: response(200, missingHtml), html: missingHtml }), /HTTP 404/);
  assert.throws(() => assertPage({ ...base, response: response(404, normalHtml), html: normalHtml }), /custom 404/);
  assert.throws(() => assertPage({ ...base, response: response(404, missingHtml, { "x-robots-tag": "index" }), html: missingHtml }), /X-Robots-Tag/);
  assert.throws(() => assertPage({ ...base, response: response(401, normalHtml), html: normalHtml }), /protected/);
  const noMeta = missingHtml.replace(/<meta[^>]*>/, "");
  assert.throws(() => assertPage({ ...base, response: response(404, noMeta), html: noMeta }), /meta tag/);
  const canonical = missingHtml.replace("</head>", '<link rel="canonical" href="/missing/"></head>');
  assert.throws(() => assertPage({ ...base, response: response(404, canonical), html: canonical }), /canonical/);
});

test("checks homepage, writing index, article and a real custom 404 without credentials", async () => {
  const visited = [];
  const messages = await checkPreview(PREVIEW, {
    fetchImpl: async (url, options) => {
      visited.push(url.pathname);
      assert.equal(options.redirect, "manual");
      assert.equal(options.headers.Authorization, undefined);
      const isMissing = url.pathname.includes("missing-page");
      return response(isMissing ? 404 : 200, isMissing ? missingHtml : normalHtml);
    },
    report: () => {},
  });
  assert.equal(visited.length, 4);
  assert.equal(messages.length, 4);
});

test("redirects cannot reach another origin, production, or non-HTTPS target", async () => {
  for (const location of ["http://127.0.0.1/internal", "https://www.alpacaxu.cn/", "https://attacker.example/"]) {
    let requests = 0;
    await assert.rejects(checkPreview(PREVIEW, {
      fetchImpl: async () => {
        requests += 1;
        return new Response(null, { status: 302, headers: { location } });
      },
      report: () => {},
    }), /outside its HTTPS origin/);
    assert.equal(requests, 4);
  }
});

test("transient responses are retried within a bounded number of attempts", async () => {
  const count = new Map();
  await checkPreview(PREVIEW, {
    fetchImpl: async (url) => {
      const attempt = (count.get(url.pathname) ?? 0) + 1;
      count.set(url.pathname, attempt);
      if (attempt === 1) return response(503, normalHtml);
      const isMissing = url.pathname.includes("missing-page");
      return response(isMissing ? 404 : 200, isMissing ? missingHtml : normalHtml);
    },
    sleep: async () => {}, report: () => {},
  });
  assert.equal([...count.values()].every((value) => value === 2), true);
});

test("network failures stop after three attempts", async () => {
  let requests = 0;
  await assert.rejects(checkPreview(PREVIEW, {
    fetchImpl: async () => { requests += 1; throw new Error("connection unavailable"); },
    sleep: async () => {}, report: () => {},
  }), /connection unavailable/);
  assert.equal(requests, 12);
});

test("GitHub lookup selects only the exact SHA, preview branch and successful non-production deployment", async () => {
  const commit = "a".repeat(40);
  const branch = "codex/astro-migration";
  let calls = 0;
  const result = await resolveGithubPreview({
    commit, branch, token: "test-token",
    fetchImpl: async (url, options) => {
      calls += 1;
      assert.equal(url.origin, "https://api.github.com");
      assert.equal(options.redirect, "error");
      assert.equal(options.headers.Authorization, "Bearer test-token");
      if (url.pathname.endsWith("/deployments")) {
        assert.equal(url.searchParams.get("sha"), commit);
        return Response.json([
          { id: 1, sha: "b".repeat(40), ref: branch, environment: "Preview" },
          { id: 2, sha: commit, ref: branch, environment: "Preview", production_environment: true },
          { id: 3, sha: commit, ref: "codex/other", environment: "Preview" },
          { id: 4, sha: commit, ref: branch, environment: "Preview", production_environment: false },
        ]);
      }
      assert.match(url.pathname, /\/deployments\/4\/statuses$/);
      return Response.json([{ state: "success", environment_url: IMMUTABLE_PREVIEW }]);
    },
  });
  assert.equal(result.commit, commit);
  assert.equal(result.deploymentId, 4);
  assert.equal(calls, 2);
});

test("GitHub deployment lookup cannot silently accept an older deployment", async () => {
  const commit = "a".repeat(40);
  let elapsed = 0;
  await assert.rejects(resolveGithubPreview({
    commit, branch: "codex/astro-migration", waitMs: 10, pollMs: 5,
    now: () => elapsed,
    sleep: async (ms) => { elapsed += ms; },
    fetchImpl: async () => Response.json([]),
  }), /No successful public Preview deployment/);
});

test("Vercel SHA-based deployment refs resolve the exact pushed commit", async () => {
  const commit = "c".repeat(40);
  const result = await resolveGithubPreview({
    commit,
    branch: "codex/astro-migration",
    fetchImpl: async (url) => url.pathname.endsWith("/deployments")
      ? Response.json([{ id: 5, sha: commit, ref: commit, environment: "Preview", production_environment: false }])
      : Response.json([{ state: "success", environment_url: IMMUTABLE_PREVIEW }]),
  });
  assert.equal(result.deploymentId, 5);
  assert.equal(result.commit, commit);
});

test("exact-commit lookup rejects a moving branch alias", async () => {
  const commit = "d".repeat(40);
  await assert.rejects(resolveGithubPreview({
    commit,
    branch: "codex/astro-migration",
    fetchImpl: async (url) => url.pathname.endsWith("/deployments")
      ? Response.json([{ id: 6, sha: commit, ref: commit, environment: "Preview", production_environment: false }])
      : Response.json([{ state: "success", environment_url: PREVIEW }]),
  }), /immutable deployment URL/);
});
