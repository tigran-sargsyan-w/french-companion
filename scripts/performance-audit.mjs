import puppeteer from "puppeteer-core";
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const BASE = process.env.AUDIT_BASE_URL || "https://tigran-sargsyan-w.github.io/french-companion/";
const MAX_ROUTES = 100;

function chromePath() {
  for (const name of ["google-chrome-stable", "google-chrome", "chromium"]) {
    try {
      const value = execSync("command -v " + name, { encoding: "utf8", shell: "/bin/bash" }).trim();
      if (value) return value;
    } catch {}
  }
  throw new Error("Chrome not found");
}

function metricMap(metrics) {
  return Object.fromEntries(metrics.map((item) => [item.name, item.value]));
}

function delta(before, after, key) {
  return Math.max(0, ((after[key] || 0) - (before[key] || 0)) * 1000);
}

function normalizeInternal(href) {
  try {
    const url = new URL(href, BASE);
    const base = new URL(BASE);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return null;
    if (!url.hash || !url.hash.startsWith("#/")) return base.origin + base.pathname;
    return url.origin + url.pathname + url.hash;
  } catch {
    return null;
  }
}

async function settle(page) {
  await page.waitForFunction(
    () => document.readyState === "complete" && !(document.body?.innerText || "").includes("Chargement"),
    { timeout: 20000 }
  ).catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, 350));
}

async function installObservers(page) {
  await page.evaluateOnNewDocument(() => {
    window.__audit = { lcp: 0, cls: 0, longTasks: [] };
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__audit.lcp = entry.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {}
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__audit.cls += entry.value;
      }).observe({ type: "layout-shift", buffered: true });
    } catch {}
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__audit.longTasks.push(entry.duration);
      }).observe({ type: "longtask", buffered: true });
    } catch {}
  });
}

async function snapshot(page, client, before, errors, failedRequests) {
  const after = metricMap((await client.send("Performance.getMetrics")).metrics);
  const data = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paints = Object.fromEntries(performance.getEntriesByType("paint").map((x) => [x.name, x.startTime]));
    const resources = performance.getEntriesByType("resource").map((x) => ({
      name: x.name,
      type: x.initiatorType || "other",
      duration: x.duration || 0,
      transferSize: x.transferSize || 0,
      decodedBodySize: x.decodedBodySize || 0,
    }));
    const images = [...document.images];
    return {
      href: location.href,
      route: location.hash || "#/",
      title: document.title,
      heading: document.querySelector("h1")?.textContent?.trim() || "",
      bodySample: (document.body?.innerText || "").slice(0, 400),
      fcp: paints["first-contentful-paint"] || 0,
      lcp: window.__audit?.lcp || 0,
      cls: window.__audit?.cls || 0,
      longTasks: window.__audit?.longTasks || [],
      timing: nav ? {
        ttfb: nav.responseStart,
        dcl: nav.domContentLoadedEventEnd,
        load: nav.loadEventEnd,
      } : null,
      dom: {
        nodes: document.querySelectorAll("*").length,
        articles: document.querySelectorAll("article").length,
        links: document.querySelectorAll("a[href]").length,
        images: images.length,
        brokenImages: images.filter((image) => image.complete && image.naturalWidth === 0).length,
        scrollHeight: document.documentElement.scrollHeight,
      },
      links: [...new Set([...document.querySelectorAll("a[href]")].map((a) => a.href).filter(Boolean))],
      resources,
    };
  });

  const dataResources = data.resources.filter((item) => item.name.includes("/data/"));
  return {
    ...data,
    errors: [...errors],
    failedRequests: [...failedRequests],
    metrics: {
      scriptMs: delta(before, after, "ScriptDuration"),
      taskMs: delta(before, after, "TaskDuration"),
      layoutMs: delta(before, after, "LayoutDuration"),
      styleMs: delta(before, after, "RecalcStyleDuration"),
      heapMB: (after.JSHeapUsedSize || 0) / 1024 / 1024,
      eventListeners: after.JSEventListeners || 0,
    },
    resources: {
      count: data.resources.length,
      transferKB: data.resources.reduce((sum, item) => sum + item.transferSize, 0) / 1024,
      decodedKB: data.resources.reduce((sum, item) => sum + item.decodedBodySize, 0) / 1024,
      dataCount: dataResources.length,
      dataTransferKB: dataResources.reduce((sum, item) => sum + item.transferSize, 0) / 1024,
      largest: [...data.resources]
        .sort((a, b) => (b.transferSize || b.decodedBodySize) - (a.transferSize || a.decodedBodySize))
        .slice(0, 10),
    },
  };
}

async function auditCold(browser, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setCacheEnabled(false);
  await installObservers(page);
  const client = await page.createCDPSession();
  await client.send("Performance.enable");

  const errors = [];
  const failedRequests = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    failedRequests.push({ url: request.url(), error: request.failure()?.errorText || "" });
  });

  const before = metricMap((await client.send("Performance.getMetrics")).metrics);
  const started = performance.now();
  let fatalError = null;

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await settle(page);
  } catch (error) {
    fatalError = String(error);
  }

  const result = await snapshot(page, client, before, errors, failedRequests).catch(() => ({
    href: url, route: new URL(url).hash || "#/", metrics: {}, dom: {}, resources: {}, links: [],
  }));
  result.wallMs = performance.now() - started;
  result.fatalError = fatalError;
  await page.close();
  return result;
}

async function auditWarm(browser, urls) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setCacheEnabled(true);
  await installObservers(page);
  const client = await page.createCDPSession();
  await client.send("Performance.enable");
  await page.goto(BASE, { waitUntil: "networkidle2", timeout: 30000 });
  await settle(page);

  const results = [];
  for (const url of urls) {
    const before = metricMap((await client.send("Performance.getMetrics")).metrics);
    const started = performance.now();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
    await settle(page);
    const result = await snapshot(page, client, before, [], []);
    result.wallMs = performance.now() - started;
    results.push(result);
  }
  await page.close();
  return results;
}

const browser = await puppeteer.launch({
  executablePath: chromePath(),
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--disable-extensions", "--window-size=1440,900"],
});

try {
  const queue = [BASE];
  const queued = new Set(queue);
  const cold = [];

  while (queue.length && cold.length < MAX_ROUTES) {
    const url = queue.shift();
    console.log("Cold audit " + (cold.length + 1) + ": " + url);
    const result = await auditCold(browser, url);
    cold.push(result);
    for (const href of result.links || []) {
      const internal = normalizeInternal(href);
      if (internal && !queued.has(internal)) {
        queued.add(internal);
        queue.push(internal);
      }
    }
  }

  const urls = cold.map((item) => item.href).filter(Boolean);
  console.log("Discovered " + urls.length + " internal pages. Running warm navigation audit.");
  const warm = await auditWarm(browser, urls);

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    routeCount: cold.length,
    cold,
    warm,
  };

  writeFileSync("performance-audit.json", JSON.stringify(report, null, 2));

  const topScript = [...cold]
    .sort((a, b) => (b.metrics?.scriptMs || 0) - (a.metrics?.scriptMs || 0))
    .slice(0, 15);
  const topLcp = [...cold].sort((a, b) => (b.lcp || 0) - (a.lcp || 0)).slice(0, 15);
  const topDom = [...cold].sort((a, b) => (b.dom?.nodes || 0) - (a.dom?.nodes || 0)).slice(0, 15);

  const row = (item, value) => "| " + (item.route || item.href) + " | " + value + " |";
  const md = [
    "# French Companion Performance Audit",
    "",
    "Routes crawled: " + cold.length,
    "",
    "## Highest cold-load scripting",
    "| Route | Script ms |",
    "| --- | ---: |",
    ...topScript.map((item) => row(item, (item.metrics?.scriptMs || 0).toFixed(1))),
    "",
    "## Highest cold-load LCP",
    "| Route | LCP ms |",
    "| --- | ---: |",
    ...topLcp.map((item) => row(item, (item.lcp || 0).toFixed(1))),
    "",
    "## Largest DOM",
    "| Route | Nodes |",
    "| --- | ---: |",
    ...topDom.map((item) => row(item, String(item.dom?.nodes || 0))),
  ].join("\n");

  writeFileSync("performance-audit.md", md);
  console.log(md);
} finally {
  await browser.close();
}
