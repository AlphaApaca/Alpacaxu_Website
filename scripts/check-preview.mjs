#!/usr/bin/env node

/** Read-only acceptance checks for this project's public Vercel previews. */
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";

export const DEFAULT_ARTICLE_PATH = "/writing/2026-10-02-datasets-and-dataloaders/";
const MAX_HTML_BYTES = 2_000_000;
const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);

export function validatePreviewUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("PREVIEW_URL must be an absolute HTTPS URL.");
  }
  const isProjectPreview = /^blogofalpaca-[a-z0-9-]+-alpacaxus-projects\.vercel\.app$/.test(url.hostname);
  if (url.protocol !== "https:" || !isProjectPreview || url.port || url.username || url.password) {
    throw new Error("Only public HTTPS previews of blogofalpaca on alpacaxus-projects.vercel.app are allowed.");
  }
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("PREVIEW_URL must be the preview origin, without a page path, query, or fragment.");
  }
  return url;
}

export function validateArticlePath(value) {
  if (!/^\/writing\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(value)) {
    throw new Error("PREVIEW_ARTICLE_PATH must be a /writing/lowercase-kebab-slug/ path.");
  }
  return value;
}

export function articlePathFromManifest(manifest) {
  if (manifest?.sourceRepo !== "AlphaApaca/repytorch" ||
      !/^[a-f0-9]{40}$/i.test(manifest?.sourceCommit ?? "") ||
      !Array.isArray(manifest.articles) || manifest.articles.some((article) =>
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article?.permalink ?? ""))) {
    throw new Error("Preview article selection requires a valid repytorch snapshot manifest.");
  }
  return manifest.articles.length ? validateArticlePath(`/writing/${manifest.articles[0].permalink}/`) : null;
}

async function previewArticlePath(commit, token) {
  if (commit) {
    if (!/^[a-f0-9]{40}$/i.test(commit)) throw new Error("Preview manifest lookup requires a full commit SHA.");
    const url = `https://api.github.com/repos/AlphaApaca/Alpacaxu_Website/contents/src/content/posts/repytorch/snapshot.json?ref=${commit}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Preview snapshot lookup returned HTTP ${response.status}.`);
    const blob = await response.json();
    if (blob.encoding !== "base64" || typeof blob.content !== "string" || blob.size > MAX_HTML_BYTES) {
      throw new Error("Preview snapshot lookup returned invalid or oversized content.");
    }
    return articlePathFromManifest(JSON.parse(Buffer.from(blob.content, "base64").toString("utf8")));
  }
  return articlePathFromManifest(JSON.parse(await readFile(new URL("../src/content/posts/repytorch/snapshot.json", import.meta.url), "utf8")));
}

function hasNoindex(value) {
  return /(?:^|[\s,:;])noindex(?:$|[\s,;])/i.test(value ?? "");
}

function htmlAttribute(tag, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = tag.match(pattern);
  return match ? match[1] ?? match[2] ?? match[3] : undefined;
}

export function hasRobotsNoindex(html) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)].some(([tag]) => {
    const name = htmlAttribute(tag, "name");
    return /^(?:robots|googlebot)$/i.test(name ?? "") && hasNoindex(htmlAttribute(tag, "content"));
  });
}

export function assertPage({ response, html, pathname, expectedStatus, custom404 = false }) {
  if (response.status === 401 || response.status === 403) {
    throw new Error(`${pathname}: preview access is protected (${response.status}). Allow public preview access or run an authenticated check separately; this check does not bypass protection.`);
  }
  if (response.status !== expectedStatus) {
    throw new Error(`${pathname}: expected HTTP ${expectedStatus}, received HTTP ${response.status}.`);
  }
  if (!/\btext\/html\b/i.test(response.headers.get("content-type") ?? "")) {
    throw new Error(`${pathname}: expected an HTML response.`);
  }
  if (!hasNoindex(response.headers.get("x-robots-tag"))) {
    throw new Error(`${pathname}: preview is missing X-Robots-Tag: noindex.`);
  }
  if (!/<html\b/i.test(html) || !/<main\b/i.test(html)) {
    throw new Error(`${pathname}: expected the site's full HTML document, not an access or error screen.`);
  }
  if (custom404) {
    if (!/data-page\s*=\s*["']not-found["']/i.test(html)) {
      throw new Error(`${pathname}: HTTP 404 does not render the site's custom 404 page.`);
    }
    if (!hasRobotsNoindex(html)) {
      throw new Error(`${pathname}: custom 404 is missing its robots noindex meta tag.`);
    }
    if (/<link\b[^>]*\brel\s*=\s*["']canonical["']/i.test(html)) {
      throw new Error(`${pathname}: custom 404 should not declare a canonical URL.`);
    }
  }
}

async function fetchPage(url, { fetchImpl, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let current = new URL(url);
  try {
    for (let redirects = 0; redirects <= 4; redirects += 1) {
      // No cookies, credentials, GitHub tokens, or authorization headers are sent.
      const response = await fetchImpl(current, {
        redirect: "manual",
        credentials: "omit",
        signal: controller.signal,
        headers: { Accept: "text/html", "User-Agent": "Alpacaxu-Website-preview-check" },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) throw new Error("Preview returned a redirect without Location.");
        const next = new URL(location, current);
        if (next.protocol !== "https:" || next.origin !== url.origin || next.username || next.password) {
          throw new Error("Preview redirected outside its HTTPS origin; refusing to follow it.");
        }
        await response.body?.cancel();
        current = next;
        continue;
      }
      const length = Number(response.headers.get("content-length"));
      if (Number.isFinite(length) && length > MAX_HTML_BYTES) {
        await response.body?.cancel();
        throw new Error("Preview HTML exceeds the diagnostic size limit.");
      }
      const reader = response.body?.getReader();
      const chunks = [];
      let bytes = 0;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value.byteLength;
          if (bytes > MAX_HTML_BYTES) {
            await reader.cancel();
            throw new Error("Preview HTML exceeds the diagnostic size limit.");
          }
          chunks.push(value);
        }
      }
      const html = Buffer.concat(chunks).toString("utf8");
      return { response, html };
    }
    throw new Error("Preview returned too many redirects.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkPreview(value, {
  articlePath = DEFAULT_ARTICLE_PATH,
  includeAbout = false,
  fetchImpl = fetch,
  attempts = 3,
  timeoutMs = 4500,
  retryDelayMs = 1000,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  report = console.log,
} = {}) {
  const base = validatePreviewUrl(value);
  if (articlePath !== null) validateArticlePath(articlePath);
  const pages = [
    { pathname: "/", expectedStatus: 200 },
    { pathname: "/writing/", expectedStatus: 200 },
    ...(articlePath ? [{ pathname: articlePath, expectedStatus: 200 }] : []),
    ...(includeAbout ? [{ pathname: "/about/", expectedStatus: 200 }] : []),
    { pathname: "/__preview-acceptance-missing-page__-9f97b37a/", expectedStatus: 404, custom404: true },
  ];
  return Promise.all(pages.map(async (page) => {
    let result;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        result = await fetchPage(new URL(page.pathname, base), { fetchImpl, timeoutMs });
        if (!TRANSIENT_STATUSES.has(result.response.status) || attempt === attempts) break;
      } catch (error) {
        if (attempt === attempts || /redirect|size limit/i.test(error.message)) {
          throw new Error(`${page.pathname}: ${error.message}`, { cause: error });
        }
      }
      await sleep(retryDelayMs);
    }
    assertPage({ ...result, ...page });
    const message = `PASS ${page.pathname}: HTTP ${result.response.status}, preview noindex${page.custom404 ? ", custom 404 + meta noindex" : ""}.`;
    report(message);
    return message;
  }));
}

/** Resolve an immutable deployment, never a moving branch alias or an older SHA. */
export async function resolveGithubPreview({
  commit,
  branch,
  token,
  fetchImpl = fetch,
  waitMs = 90_000,
  pollMs = 5000,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = Date.now,
}) {
  if (!/^[a-f0-9]{40}$/i.test(commit ?? "") || !/^codex\/[A-Za-z0-9_./-]+$/.test(branch ?? "")) {
    throw new Error("Cloud acceptance requires the full deployed commit SHA and a codex/ preview branch.");
  }
  const repository = "AlphaApaca/Alpacaxu_Website";
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Alpacaxu-Website-preview-check",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const deadline = now() + waitMs;
  const githubJson = async (pathname) => {
    // URLs are constructed here, not taken from untrusted API or page content.
    const result = await fetchImpl(new URL(pathname, "https://api.github.com"), {
      headers, redirect: "error", signal: AbortSignal.timeout(Math.max(1, Math.min(8000, deadline - now()))),
    });
    if (!result.ok) throw new Error(`GitHub deployment lookup returned HTTP ${result.status}.`);
    return result.json();
  };
  while (now() < deadline) {
    const deployments = await githubJson(`/repos/${repository}/deployments?sha=${commit}&environment=Preview&per_page=10`);
    if (!Array.isArray(deployments)) throw new Error("GitHub did not return a deployment list.");
    for (const deployment of deployments) {
      if (now() >= deadline) break;
      // Vercel creates deployments using a SHA ref, rather than a branch ref.
      // The pushed SHA and codex/ branch come from the trusted push event above.
      const matchesRef = deployment.ref === branch || deployment.ref === commit;
      if (deployment.sha !== commit || !matchesRef || deployment.environment !== "Preview" || deployment.production_environment === true) continue;
      if (!Number.isSafeInteger(deployment.id) || deployment.id <= 0) continue;
      const statuses = await githubJson(`/repos/${repository}/deployments/${deployment.id}/statuses?per_page=1`);
      if (!Array.isArray(statuses)) throw new Error("GitHub did not return deployment statuses.");
      const latest = statuses[0];
      if (latest?.state === "success") {
        const url = validatePreviewUrl(latest.environment_url);
        if (url.hostname.startsWith("blogofalpaca-git-")) {
          throw new Error("Exact-commit acceptance requires an immutable deployment URL, not a moving branch alias.");
        }
        return { url: url.href, commit, deploymentId: deployment.id };
      }
    }
    if (now() >= deadline) break;
    await sleep(Math.min(pollMs, deadline - now()));
  }
  throw new Error(`No successful public Preview deployment for commit ${commit} was found within ${waitMs / 1000} seconds. This is not a 404 acceptance pass; check Vercel deployment or authorization, then rerun the job.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    let value = process.env.PREVIEW_URL || process.argv[2];
    if (process.argv[2] === "--github-deployment") {
      const deployment = await resolveGithubPreview({
        commit: process.env.PREVIEW_COMMIT,
        branch: process.env.PREVIEW_BRANCH,
        token: process.env.GITHUB_TOKEN,
      });
      value = deployment.url;
      console.log(`Checking immutable Vercel deployment ${deployment.deploymentId} for commit ${deployment.commit}: ${value}`);
    }
    const articlePath = process.env.PREVIEW_ARTICLE_PATH || await previewArticlePath(process.env.PREVIEW_COMMIT, process.env.GITHUB_TOKEN);
    if (articlePath === null) console.log("Snapshot has no published articles; checking the writing index without a removed article route.");
    await checkPreview(value, { articlePath, includeAbout: true });
  } catch (error) {
    console.error(`Preview acceptance failed: ${error.message}`);
    process.exitCode = 1;
  }
}
