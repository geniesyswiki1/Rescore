import { useState } from "react";
import { ScrollView } from "react-native";
import { router } from "expo-router";
import { ratingFor } from "@rescore/content/scoring";
import { Body, Button, H1, H2, Panel, Screen, Small } from "@/components/ui";
import { useCases } from "@/lib/store";

/**
 * The paywall.
 *
 * Store rules require a consumable in-app purchase, so the real purchase goes through
 * RevenueCat. Until the store products are live the button records the purchase locally
 * so the rest of the flow can be walked; it never claims a payment was taken.
 */
const TIERS = {
  pack_r01: { sku: "pack_r01", price: "GBP 148.99", label: "Rating 0 or 1 pack" },
  pack_r2: { sku: "pack_r2", price: "GBP 98.99", label: "Rating 2 pack" },
  pack_r34: { sku: "pack_r34", price: "GBP 48.99", label: "Rating 3 or 4, get to 5" },
} as const;

function tierFor(rating: number | null) {
  if (rating === null) return TIERS.pack_r01;
  if (rating <= 1) return TIERS.pack_r01;
  if (rating === 2) return TIERS.pack_r2;
  return TIERS.pack_r34;
}

export default function PaywallScreen() {
  const { current, update } = useCases();
  const [busy, setBusy] = useState(false);

  if (!current) {
    return (
      <Screen>
        <Body>Read a report first.</Body>
      </Screen>
    );
  }

  const rating = current.scoresBefore ? ratingFor(current.scoresBefore).rating : current.ratingBefore;
  const tier = tierFor(rating);

  async function buy() {
    setBusy(true);
    // TODO: replace with RevenueCat purchase of tier.sku, then unlock on the entitlement.
    await update(current!.id, (previous) => ({ ...previous, paid: true }));
    setBusy(false);
    router.push("/intake");
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <H1>{tier.label}</H1>
        <Body>One payment. No subscription. Free re-runs until your outcome is recorded.</Body>

        <Panel>
          <Body>An action plan, item by item from your report, with the evidence each one needs.</Body>
          <Body>Your food safety management system, written for your kitchen, not a blank template.</Body>
          <Body>A readiness check before you ask the council to come back.</Body>
          <Body>Your right to reply, your re-visit request and the evidence pack for the platforms.</Body>
        </Panel>

        <H2>{tier.price}</H2>
        <Small>
          It does not buy a rating. The cleaning, the repairs and the training are yours to do, and the
          officer scores what they find on the day.
        </Small>

        <Button label={busy ? "Working" : `Build my re-rating pack, ${tier.price}`} onPress={buy} disabled={busy} />
        <Button label="Restore purchases" secondary onPress={() => undefined} />
      </ScrollView>
    </Screen>
  );
}
