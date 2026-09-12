import { test } from "node:test";
import assert from "node:assert/strict";
import { RATING_PAGES, allPaths, councilPage, fixPage, home, platformPage, ratingPage } from "./landing.js";
import { launchCouncils } from "./councils/index.js";
import { platforms } from "./platforms/index.js";

test("the sitemap carries the 70 landing pages plus the four standing pages", () => {
  const paths = allPaths();
  // 1 home + 5 ratings + 3 fix + 3 platforms + 59 councils = 71, less home = 70 landing pages.
  assert.equal(launchCouncils.length, 59);
  assert.equal(paths.filter((p) => p.startsWith("/rating/")).length, 5);
  assert.equal(paths.filter((p) => p.startsWith("/fix/")).length, 3);
  assert.equal(paths.filter((p) => p.startsWith("/platform/")).length, 3);
  assert.equal(paths.filter((p) => p.startsWith("/council/")).length, 59);
  assert.equal(paths.length, 75);
  assert.equal(new Set(paths).size, paths.length, "sitemap has a duplicate path");
});

test("every rating page has a unique title and a price", () => {
  const titles = new Set<string>();
  for (const rating of RATING_PAGES) {
    const page = ratingPage(rating);
    assert.equal(titles.has(page.title), false);
    titles.add(page.title);
    assert.ok(page.price > 0);
    assert.ok(page.meansBody.length > 40);
  }
  assert.equal(ratingPage(0).price, 149);
  assert.equal(ratingPage(1).price, 149);
  assert.equal(ratingPage(2).price, 99);
  assert.equal(ratingPage(3).price, 49);
  assert.equal(ratingPage(4).price, 49);
});

test("fix pages cover the three scored areas", () => {
  assert.equal(fixPage("confidence").slug, "confidence-in-management");
  assert.match(fixPage("confidence").title, /costs the most points/);
  assert.ok(fixPage("hygiene").items.length > 0);
  assert.ok(fixPage("structure").items.length > 0);
});

test("a platform page only states a minimum rating where the platform's own policy was read", () => {
  for (const platform of platforms) {
    const page = platformPage(platform.slug);
    assert.match(page.title, new RegExp(platform.name));
    if (!platform.verified) {
      assert.equal(platform.minimumRating, null, `${platform.name} states a minimum without a first-party source`);
    } else {
      assert.equal(platform.sourceType, "first_party");
      assert.ok(platform.sourceUrl);
    }
  }
});

test("every launch council has a page and no council page is missing its council", () => {
  for (const council of launchCouncils) {
    const page = councilPage(council.slug);
    assert.ok(page, `no page for ${council.name}`);
    assert.match(page.title, new RegExp(council.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.equal(councilPage("not-a-council"), null);
});

test("no landing copy contains an em dash or en dash", () => {
  const copy = [
    home.headline,
    home.sub,
    home.whatThisIsAndIsNot,
    ...home.whatYouGet,
    ...home.faq.flatMap((f) => [f.q, f.a]),
    ...RATING_PAGES.flatMap((r) => {
      const p = ratingPage(r);
      return [p.title, p.meansBody, p.movesBody];
    }),
  ].join(" ");
  assert.equal(/[–—]/.test(copy), false);
});

test("no landing copy promises a rating", () => {
  const copy = [home.headline, home.sub, home.whatThisIsAndIsNot, ...home.faq.map((f) => f.a)]
    .join(" ")
    .toLowerCase();
  for (const banned of ["guaranteed 5", "get your 5 back", "beat the inspector", "guarantee a rating"]) {
    assert.equal(copy.includes(banned), false, `landing copy contains "${banned}"`);
  }
});
