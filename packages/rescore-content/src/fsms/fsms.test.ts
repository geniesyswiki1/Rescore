import { test } from "node:test";
import assert from "node:assert/strict";
import {
  type ConfirmedFacts,
  type KitchenProfile,
  confirmPrompts,
  genericityCheck,
  renderPack,
  renderSafeMethod,
  safeMethods,
} from "./index.js";

const takeaway: KitchenProfile = {
  cooks: true,
  cools: true,
  reheats: true,
  hotHolds: true,
  freezes: true,
};

const fact = (value: string) => ({ key: "", value, confirmedAt: "2026-09-12" });

test("an unconfirmed fridge temperature renders as a CONFIRM marker", () => {
  const chilling = safeMethods.find((m) => m.id === "sm-chilling");
  assert.ok(chilling);
  const rendered = renderSafeMethod(chilling, {});
  assert.match(rendered.body, /\[CONFIRM: What temperature does each chilled unit run at\?\]/);
  assert.equal(rendered.complete, false);
  assert.equal(rendered.missing.length, chilling.slots.length);
});

test("a confirmed fact is used verbatim and the marker disappears", () => {
  const chilling = safeMethods.find((m) => m.id === "sm-chilling");
  assert.ok(chilling);
  const facts: ConfirmedFacts = {
    cold_units: fact("Fridge 1 under the prep table, Fridge 2 by the back door"),
    cold_target: fact("Fridge 1 at 4 degrees C, Fridge 2 at 3 degrees C"),
    cold_check_times: fact("Opening and close"),
  };
  const rendered = renderSafeMethod(chilling, facts);
  assert.equal(rendered.complete, true);
  assert.equal(rendered.missing.length, 0);
  assert.match(rendered.body, /Fridge 1 under the prep table/);
  assert.equal(rendered.body.includes("[CONFIRM"), false);
});

test("the template example is never used as an answer", () => {
  const chilling = safeMethods.find((m) => m.id === "sm-chilling");
  assert.ok(chilling);
  const rendered = renderSafeMethod(chilling, {});
  for (const slot of chilling.slots) {
    assert.equal(rendered.body.includes(slot.example), false, `example leaked for ${slot.key}`);
  }
});

test("a fact with no confirmation date does not count as confirmed", () => {
  const chilling = safeMethods.find((m) => m.id === "sm-chilling");
  assert.ok(chilling);
  const rendered = renderSafeMethod(chilling, {
    cold_units: { key: "cold_units", value: "Fridge 1", confirmedAt: "" },
  });
  assert.match(rendered.body, /\[CONFIRM: List every fridge/);
});

test("an empty fact does not count as confirmed", () => {
  const chilling = safeMethods.find((m) => m.id === "sm-chilling");
  assert.ok(chilling);
  const rendered = renderSafeMethod(chilling, {
    cold_units: { key: "cold_units", value: "   ", confirmedAt: "2026-09-12" },
  });
  assert.match(rendered.body, /\[CONFIRM: List every fridge/);
});

test("the pack only carries the safe methods this kitchen needs", () => {
  const coldOnly: KitchenProfile = { cooks: false, cools: false, reheats: false, hotHolds: false, freezes: false };
  const pack = renderPack({ businessName: "Test Kebab", generatedOn: "2026-09-12", profile: coldOnly, facts: {} });
  const ids = pack.safeMethods.map((m) => m.id);
  assert.equal(ids.includes("sm-cross-contamination"), true);
  assert.equal(ids.includes("sm-cooking"), false);
  assert.equal(ids.includes("sm-hot-holding"), false);

  const full = renderPack({ businessName: "Test Kebab", generatedOn: "2026-09-12", profile: takeaway, facts: {} });
  assert.equal(full.safeMethods.length, safeMethods.length);
});

test("an empty pack lists every confirm prompt and is not complete", () => {
  const pack = renderPack({ businessName: "Test Kebab", generatedOn: "2026-09-12", profile: takeaway, facts: {} });
  assert.equal(pack.complete, false);
  const totalSlots = safeMethods.reduce((n, m) => n + m.slots.length, 0);
  assert.equal(pack.confirmations.length, totalSlots);
  assert.equal(confirmPrompts(pack).length, totalSlots);
});

test("the pack always carries the not-a-guarantee footer", () => {
  const pack = renderPack({ businessName: "Test Kebab", generatedOn: "2026-09-12", profile: takeaway, facts: {} });
  assert.match(pack.footer, /not a guarantee of a rating|not an inspection/);
});

test("the allergen matrix tells the operator to confirm a blank cell", () => {
  const pack = renderPack({ businessName: "Test Kebab", generatedOn: "2026-09-12", profile: takeaway, facts: {} });
  const matrix = pack.recordSheets.find((s) => s.id === "rs-allergen-matrix");
  assert.ok(matrix);
  assert.equal(matrix.blankCellNote, "Confirm with the person who prepares this dish.");
  // All 14 allergens plus the dish column.
  assert.equal(matrix.columns.length, 15);
});

test("genericity check flags an unconfirmed method", () => {
  const pack = renderPack({ businessName: "Test Kebab", generatedOn: "2026-09-12", profile: takeaway, facts: {} });
  const findings = genericityCheck(pack, ["Fridge 1"]);
  assert.equal(findings.length, pack.safeMethods.length);
  assert.match(findings[0]?.reason ?? "", /still to confirm/);
});

test("genericity check passes a method that names this kitchen's own equipment", () => {
  const chilling = safeMethods.find((m) => m.id === "sm-chilling");
  assert.ok(chilling);
  const pack = {
    businessName: "Test Kebab",
    generatedOn: "2026-09-12",
    safeMethods: [
      renderSafeMethod(chilling, {
        cold_units: fact("Fridge 1 under the prep table"),
        cold_target: fact("4 degrees C"),
        cold_check_times: fact("Opening and close"),
      }),
    ],
    recordSheets: [],
    footer: "",
    confirmations: [],
    complete: true,
  };
  assert.equal(genericityCheck(pack, ["Fridge 1 under the prep table"]).length, 0);
  assert.equal(genericityCheck(pack, ["Walk-in chiller"]).length, 1);
});
