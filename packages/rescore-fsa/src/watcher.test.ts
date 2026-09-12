import { test } from "node:test";
import assert from "node:assert/strict";
import { FsaClient, fullAddress, type FsaEstablishment } from "./client.js";
import { InMemoryLeadStore, isNewLead, runWatch, slackMessage, toLead } from "./watcher.js";

function establishment(overrides: Partial<FsaEstablishment> = {}): FsaEstablishment {
  return {
    FHRSID: 1001,
    BusinessName: "Test Kebab House",
    BusinessType: "Takeaway/sandwich shop",
    BusinessTypeID: 7844,
    AddressLine1: "1 High Street",
    AddressLine2: null,
    AddressLine3: "London",
    AddressLine4: null,
    PostCode: "E13 0AA",
    RatingValue: "1",
    RatingKey: "fhrs_1_en-gb",
    RatingDate: "2026-09-01T00:00:00",
    LocalAuthorityCode: "525",
    LocalAuthorityName: "Newham",
    NewRatingPending: false,
    RightToReply: null,
    scores: { Hygiene: 10, Structural: 15, ConfidenceInManagement: 20 },
    ...overrides,
  };
}

/** A client whose pages come from a fixture, so the tests never touch the FSA. */
function stubClient(pages: Record<string, FsaEstablishment[]>): FsaClient {
  const client = new FsaClient({ requestsPerSecond: 1000 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).allEstablishments = async (authorityId: number, ratingKey: string) =>
    pages[`${authorityId}:${ratingKey}`] ?? [];
  return client;
}

test("an address skips the empty lines", () => {
  assert.equal(fullAddress(establishment()), "1 High Street, London, E13 0AA");
  assert.equal(
    fullAddress(establishment({ AddressLine1: "  ", AddressLine3: null, PostCode: "E13 0AA" })),
    "E13 0AA",
  );
});

test("a lead carries the scores and the FSA link", () => {
  const lead = toLead(establishment(), 112, "2026-09-12T00:00:00.000Z");
  assert.equal(lead.fhrsid, 1001);
  assert.equal(lead.rating, "1");
  assert.equal(lead.ratingDate, "2026-09-01");
  assert.deepEqual(lead.scores, { hygiene: 10, structure: 15, confidence: 20 });
  assert.equal(lead.fsaUrl, "https://ratings.food.gov.uk/business/1001");
  assert.equal(lead.status, "new");
});

test("an establishment with no scores published gives a lead with no scores", () => {
  const lead = toLead(establishment({ scores: null }), 112, "2026-09-12T00:00:00.000Z");
  assert.equal(lead.scores, null);
  assert.match(slackMessage(lead), /Test Kebab House/);
  assert.equal(slackMessage(lead).includes("H "), false);
});

test("a business already seen at the same rating date is not new again", () => {
  const first = toLead(establishment(), 112, "2026-09-12T00:00:00.000Z");
  assert.equal(isNewLead(null, first), true);
  assert.equal(isNewLead(first, first), false);

  const reinspected = toLead(establishment({ RatingDate: "2026-11-20T00:00:00" }), 112, "2026-11-21T00:00:00.000Z");
  assert.equal(isNewLead(first, reinspected), true);
});

test("a second run over the same data produces no new leads", async () => {
  const store = new InMemoryLeadStore();
  const client = stubClient({ "112:0": [], "112:1": [establishment()], "112:2": [] });

  const first = await runWatch({ client, store, authorityIds: [112] });
  assert.equal(first.newLeads.length, 1);
  assert.equal(first.establishmentsSeen, 1);

  const second = await runWatch({ client, store, authorityIds: [112] });
  assert.equal(second.newLeads.length, 0);
  assert.equal(store.all().length, 1);
});

test("a re-inspection makes the business a lead again and keeps when we first saw it", async () => {
  const store = new InMemoryLeadStore();
  await runWatch({
    client: stubClient({ "112:1": [establishment()] }),
    store,
    authorityIds: [112],
    now: () => new Date("2026-09-12T00:00:00.000Z"),
  });

  const again = await runWatch({
    client: stubClient({ "112:1": [establishment({ RatingDate: "2026-11-20T00:00:00" })] }),
    store,
    authorityIds: [112],
    now: () => new Date("2026-11-21T00:00:00.000Z"),
  });

  assert.equal(again.newLeads.length, 1);
  assert.equal(again.newLeads[0]?.firstSeen, "2026-09-12T00:00:00.000Z");
  assert.equal(again.newLeads[0]?.ratingDate, "2026-11-20");
});

test("outreach status survives a routine re-scan", async () => {
  const store = new InMemoryLeadStore();
  const client = stubClient({ "112:1": [establishment()] });
  await runWatch({ client, store, authorityIds: [112] });

  const lead = await store.get(1001);
  assert.ok(lead);
  await store.upsert({ ...lead, status: "posted" });

  await runWatch({ client, store, authorityIds: [112] });
  assert.equal((await store.get(1001))?.status, "posted");
});

test("one authority failing does not stop the rest", async () => {
  const store = new InMemoryLeadStore();
  const client = new FsaClient({ requestsPerSecond: 1000 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).allEstablishments = async (authorityId: number) => {
    if (authorityId === 99) throw new Error("FSA /Establishments returned 503");
    return [establishment()];
  };

  const result = await runWatch({ client, store, authorityIds: [99, 112], ratingKeys: ["1"] });
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0]?.authorityId, 99);
  assert.equal(result.newLeads.length, 1);
});

test("the Slack line matches the shape the n8n workflow posts", () => {
  const lead = toLead(establishment({ NewRatingPending: true }), 112, "2026-09-12T00:00:00.000Z");
  const message = slackMessage(lead);
  assert.match(message, /^\*1\* \| Test Kebab House \(Takeaway\/sandwich shop\)$/m);
  assert.match(message, /Newham \| inspected 2026-09-01 \| H 10 \/ S 15 \/ CiM 20 \| re-rating pending/);
  assert.match(message, /https:\/\/ratings\.food\.gov\.uk\/business\/1001/);
});
