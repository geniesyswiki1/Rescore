import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, TextInput } from "react-native";
import { router } from "expo-router";
import { renderPack } from "@rescore/content/fsms";
import { Body, Button, H1, Panel, Screen, Small } from "@/components/ui";
import { useCases } from "@/lib/store";
import { colors, radius } from "@/lib/theme";

/**
 * The confirm prompts.
 *
 * The owner walks the kitchen answering these in front of the thing being asked about,
 * which is the whole reason this screen is on a phone. Nothing is filled in for them.
 */
export default function ConfirmScreen() {
  const { current, update } = useCases();
  const [draft, setDraft] = useState<Record<string, string>>({});

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

  async function confirm(key: string) {
    const value = (draft[key] ?? "").trim();
    if (!value) return;
    await update(current!.id, (previous) => ({
      ...previous,
      facts: { ...previous.facts, [key]: { key, value, confirmedAt: new Date().toISOString() } },
    }));
    setDraft((previous) => ({ ...previous, [key]: "" }));
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <H1>
          {pack.complete
            ? "Every fact confirmed"
            : `${pack.confirmations.length} fact${pack.confirmations.length === 1 ? "" : "s"} to confirm`}
        </H1>
        <Body>
          Answer these standing in front of the thing they ask about. Anything you do not confirm is left
          blank in your paperwork, marked for you to come back to.
        </Body>

        {pack.confirmations.map(({ methodTitle, slot }) => (
          <Panel key={slot.key}>
            <Small>{methodTitle}</Small>
            <Body>{slot.prompt}</Body>
            <TextInput
              style={styles.input}
              value={draft[slot.key] ?? ""}
              onChangeText={(value) => setDraft((previous) => ({ ...previous, [slot.key]: value }))}
              placeholder={slot.example}
              placeholderTextColor={colors.muted}
              multiline
            />
            <Button label="Confirm" onPress={() => confirm(slot.key)} disabled={!(draft[slot.key] ?? "").trim()} />
          </Panel>
        ))}

        <Button label="Readiness check" onPress={() => router.push("/ready")} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius,
    backgroundColor: "#fff",
    color: colors.ink,
    padding: 12,
    marginTop: 8,
    fontSize: 15,
    minHeight: 48,
    textAlignVertical: "top",
  },
});
