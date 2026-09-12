import { useMemo } from "react";
import { ScrollView } from "react-native";
import { router } from "expo-router";
import { genericityCheck, renderPack } from "@rescore/content/fsms";
import { Body, Button, H1, H2, Panel, Screen, Small } from "@/components/ui";
import { progress, useCases } from "@/lib/store";

/**
 * The readiness check.
 *
 * Strict on purpose. The operator is about to spend money and wait months, so a false
 * pass costs them both. Ready means every item evidenced and every fact confirmed.
 */
export default function ReadyScreen() {
  const { current, update } = useCases();

  const pack = useMemo(
    () =>
      current
        ? renderPack({
            businessName: current.businessName || "your business",
            generatedOn: new Date().toISOString().slice(0, 10),
            profile: current.profile,
            facts: current.facts,
          })
        : null,
    [current],
  );

  if (!current || !pack) {
    return (
      <Screen>
        <Body>Read a report first.</Body>
      </Screen>
    );
  }

  const state = progress(current);
  const namedThings = Object.values(current.facts).map((fact) => fact.value);
  const generic = genericityCheck(pack, namedThings);
  const ready = state.ready && pack.complete && generic.length === 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <H1>{ready ? "Ready to request a re-visit" : "Not ready yet"}</H1>

        <H2>Your report&apos;s items</H2>
        {current.items.map((item) => (
          <Panel key={item.id}>
            <Body>{item.originalText}</Body>
            <Small>
              {item.status === "evidenced"
                ? `Passed. Evidence dated ${item.evidence[item.evidence.length - 1]?.capturedAt.slice(0, 10)}.`
                : item.status === "done_needs_evidence"
                  ? "Marked done, but nothing has been photographed. An officer will want to see it."
                  : "Outstanding."}
            </Small>
          </Panel>
        ))}

        <H2>Your food safety pack</H2>
        {pack.complete ? (
          <Body>Every fact confirmed.</Body>
        ) : (
          <Body>
            {pack.confirmations.length} fact{pack.confirmations.length === 1 ? "" : "s"} still to confirm, so
            parts of your pack are still marked for you to come back to.
          </Body>
        )}
        {generic.map((finding) => (
          <Panel key={finding.methodId}>
            <Body>{finding.methodTitle}</Body>
            <Small>{finding.reason}</Small>
          </Panel>
        ))}

        <H2>After the re-visit</H2>
        <Body>Tell us what happened so we can keep your case up to date.</Body>
        <Button
          label="Waiting for the visit"
          secondary
          onPress={() =>
            update(current.id, (previous) => ({
              ...previous,
              outcome: { status: "waiting", ratingAfter: null },
            }))
          }
        />
        <Button
          label="Officer found more items, upload the letter"
          secondary
          onPress={() => router.push("/")}
        />

        {ready ? null : <Button label="Back to the plan" onPress={() => router.push("/plan")} />}
      </ScrollView>
    </Screen>
  );
}
