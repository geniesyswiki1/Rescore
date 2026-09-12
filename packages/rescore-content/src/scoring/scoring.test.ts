import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AREA_KEYS,
  allPermittedCombinations,
  area,
  assertPermittedScores,
  gapTo,
  heroSentence,
  nextRatingUp,
  ratingBands,
  ratingFor,
  requirementsFor,
  scoreMeaning,
  type AreaScores,
} from "./index.js";

const scores = (hygiene: number, structure: number, confidence: number): AreaScores => ({
  hygiene,
  structure,
  confidence,
});

test("Brand Standard Table 4 worked examples", () => {
  // 5, 5, 5 -> total 15, highest 5 -> rating 5
  assert.equal(ratingFor(scores(5, 5, 5)).rating, 5);
  // 0, 5, 10 -> total 15, highest 10 -> drops to rating 4
  assert.equal(ratingFor(scores(0, 5, 10)).rating, 4);
  // 5, 5, 20 -> total 30, highest 20 -> drops from 3 to 1
  assert.equal(ratingFor(scores(5, 5, 20)).rating, 1);
});

test("the additional scoring factor is recorded when it bites", () => {
  const capped = ratingFor(scores(5, 5, 20));
  assert.equal(capped.bandFromTotal, 3);
  assert.equal(capped.rating, 1);
  assert.equal(capped.cappedByWorstArea, true);
  assert.equal(capped.limitingArea, "confidence");

  const clean = ratingFor(scores(5, 5, 5));
  assert.equal(clean.cappedByWorstArea, false);
  assert.equal(clean.limitingArea, null);
});

test("Table 3 band edges map to the published ratings", () => {
  assert.equal(ratingFor(scores(0, 0, 0)).rating, 5); // total 0
  assert.equal(ratingFor(scores(5, 5, 5)).rating, 5); // total 15
  assert.equal(ratingFor(scores(5, 5, 10)).rating, 4); // total 20
  assert.equal(ratingFor(scores(10, 10, 5)).rating, 3); // total 25
  assert.equal(ratingFor(scores(10, 10, 10)).rating, 3); // total 30
  assert.equal(ratingFor(scores(15, 15, 5)).rating, 2); // total 35
  assert.equal(ratingFor(scores(15, 15, 10)).rating, 2); // total 40
  assert.equal(ratingFor(scores(20, 15, 10)).rating, 1); // total 45
  assert.equal(ratingFor(scores(20, 20, 10)).rating, 1); // total 50
  assert.equal(ratingFor(scores(25, 25, 5)).rating, 0); // total 55
  assert.equal(ratingFor(scores(25, 25, 30)).rating, 0); // total 80, the worst possible
});

test("descriptors come from the Brand Standard", () => {
  assert.equal(ratingFor(scores(0, 0, 0)).descriptor, "Very good");
  assert.equal(ratingFor(scores(25, 25, 30)).descriptor, "Urgent improvement necessary");
});

test("every permitted combination produces exactly one rating in 0 to 5", () => {
  const combinations = allPermittedCombinations();
  // 6 hygiene x 6 structure x 5 confidence
  assert.equal(combinations.length, 180);
  for (const combination of combinations) {
    const result = ratingFor(combination);
    assert.ok(result.rating >= 0 && result.rating <= 5, JSON.stringify(combination));
    assert.equal(Number.isInteger(result.rating), true);
  }
});

test("no total falls outside a band", () => {
  for (const combination of allPermittedCombinations()) {
    const sum = combination.hygiene + combination.structure + combination.confidence;
    const covered = ratingBands.some((b) => sum >= b.totalMin && sum <= b.totalMax);
    assert.ok(covered, `total ${sum} is not covered by any band`);
  }
});

test("confidence in management cannot be scored 15 or 25", () => {
  assert.deepEqual(area("confidence").permittedScores, [0, 5, 10, 20, 30]);
  assert.throws(() => assertPermittedScores(scores(5, 5, 15)), /Management of food safety cannot be scored 15/);
  assert.throws(() => assertPermittedScores(scores(5, 5, 25)), /Management of food safety cannot be scored 25/);
});

test("hygiene and structure cannot be scored 30", () => {
  assert.throws(() => assertPermittedScores(scores(30, 5, 5)), /Hygienic food handling cannot be scored 30/);
  assert.throws(() => assertPermittedScores(scores(5, 30, 5)), /cannot be scored 30/);
});

test("requirements for a target rating", () => {
  assert.deepEqual(requirementsFor(5), { totalMax: 15, individualMax: 5 });
  assert.deepEqual(requirementsFor(3), { totalMax: 30, individualMax: 10 });
  assert.deepEqual(requirementsFor(0), { totalMax: 80, individualMax: null });
});

test("meeting a target's caps and total really does produce that rating", () => {
  for (const target of [1, 2, 3, 4, 5] as const) {
    const req = requirementsFor(target);
    for (const combination of allPermittedCombinations()) {
      const sum = combination.hygiene + combination.structure + combination.confidence;
      const worst = Math.max(combination.hygiene, combination.structure, combination.confidence);
      const meetsRequirement = sum <= req.totalMax && (req.individualMax === null || worst <= req.individualMax);
      if (meetsRequirement) {
        assert.ok(
          ratingFor(combination).rating >= target,
          `${JSON.stringify(combination)} meets the requirement for ${target} but rates ${ratingFor(combination).rating}`,
        );
      }
    }
  }
});

test("gapTo names the points that must come off a rating-1 kitchen", () => {
  // A common rating 1: hygiene 10, structure 15, confidence 20. Total 45, highest 20.
  const case1 = scores(10, 15, 20);
  assert.equal(ratingFor(case1).rating, 1);

  const toThree = gapTo(case1, 3);
  assert.equal(toThree.alreadyThere, false);
  assert.equal(toThree.totalMax, 30);
  const confidence = toThree.areas.find((a) => a.key === "confidence");
  assert.equal(confidence?.cap, 10);
  assert.equal(confidence?.mustLose, 10); // 20 down to 10
  const structure = toThree.areas.find((a) => a.key === "structure");
  assert.equal(structure?.mustLose, 5); // 15 down to 10
  // After the caps: 10 + 10 + 10 = 30, which is inside the total for a 3.
  assert.equal(toThree.totalMustLose, 0);
});

test("gapTo adds the further total reduction when caps alone are not enough", () => {
  // Hygiene 10, structure 10, confidence 10. Total 30, rating 3.
  const case3 = scores(10, 10, 10);
  assert.equal(ratingFor(case3).rating, 3);

  const toFive = gapTo(case3, 5);
  // Every area must come down to 5, leaving a total of 15, which is inside the band.
  assert.equal(toFive.areas.every((a) => a.mustLose === 5), true);
  assert.equal(toFive.totalMustLose, 0);
  assert.equal(toFive.totalMax, 15);
});

test("gapTo reports a target already reached", () => {
  const good = scores(5, 5, 5);
  const toThree = gapTo(good, 3);
  assert.equal(toThree.alreadyThere, true);
  assert.equal(toThree.areas.every((a) => a.mustLose === 0), true);
});

test("nextRatingUp stops at 5", () => {
  assert.equal(nextRatingUp(scores(25, 25, 30)), 1);
  assert.equal(nextRatingUp(scores(10, 15, 20)), 2);
  assert.equal(nextRatingUp(scores(0, 0, 0)), null);
});

test("hero sentence names the area, the points and what moves them", () => {
  const sentence = heroSentence(scores(10, 15, 20), "confidence");
  assert.match(sentence, /^Management of food safety: 20 points\./);
  assert.match(sentence, /10 or below for a 3/);
  assert.match(sentence, /5 or below for a 5/);
  assert.match(sentence, /paperwork/);

  assert.equal(heroSentence(scores(0, 15, 20), "hygiene"), "Hygienic food handling: 0 points. Nothing to take off here.");
});

test("score meanings exist for every permitted score", () => {
  for (const key of AREA_KEYS) {
    for (const score of area(key).permittedScores) {
      assert.ok(scoreMeaning(key, score), `no meaning for ${key} ${score}`);
    }
  }
  assert.equal(scoreMeaning("confidence", 15), null);
});

test("no generated copy contains an em dash or en dash", () => {
  const generated = [
    ...AREA_KEYS.map((key) => heroSentence(scores(10, 15, 20), key)),
    ...AREA_KEYS.flatMap((key) => area(key).permittedScores.map((s) => scoreMeaning(key, s) ?? "")),
    ...ratingBands.map((b) => b.descriptor),
  ].join(" ");
  assert.equal(/[–—]/.test(generated), false);
});
