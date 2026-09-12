import { useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { itemById, workNotPaperworkNote } from "@rescore/content/items";
import { Body, Button, H1, H2, Panel, Screen, Small } from "@/components/ui";
import { progress, useCases, type PlanItem } from "@/lib/store";
import { colors } from "@/lib/theme";

const AREA_LABELS = {
  confidence: "Management of food safety",
  hygiene: "Hygienic food handling",
  structure: "Cleanliness and condition of facilities",
} as const;

const STATUS_LABEL: Record<PlanItem["status"], string> = {
  open: "Open",
  done_needs_evidence: "Done, needs evidence",
  evidenced: "Evidenced",
  mismatch: "Evidence doesn't show it",
};

/**
 * The action plan as a checklist the owner works through in the kitchen.
 *
 * Evidence is captured with the camera and stamped with the time it was taken, so the
 * photo carries a date without the operator having to add one.
 */
export default function PlanScreen() {
  const { current, update } = useCases();
  const [busyItem, setBusyItem] = useState<string | null>(null);

  if (!current) {
    return (
      <Screen>
        <Body>Read a report first.</Body>
      </Screen>
    );
  }

  const state = progress(current);

  async function capture(item: PlanItem) {
    setBusyItem(item.id);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.6, exif: true });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const capturedAt = new Date().toISOString();
      await update(current!.id, (previous) => ({
        ...previous,
        items: previous.items.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                status: "evidenced",
                doneAt: entry.doneAt ?? capturedAt,
                evidence: [...entry.evidence, { uri: asset.uri, capturedAt, note: null }],
              }
            : entry,
        ),
      }));
    } finally {
      setBusyItem(null);
    }
  }

  async function markDone(item: PlanItem) {
    await update(current!.id, (previous) => ({
      ...previous,
      items: previous.items.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              status: entry.evidence.length > 0 ? "evidenced" : "done_needs_evidence",
              doneAt: new Date().toISOString(),
            }
          : entry,
      ),
    }));
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <H1>
          {state.open === 0
            ? "Ready to request a re-visit"
            : `${state.open} item${state.open === 1 ? "" : "s"} still open`}
        </H1>
        <Small>
          {state.evidenced} of {state.total} evidenced.
        </Small>

        {(["confidence", "hygiene", "structure"] as const).map((area) => {
          const items = current.items.filter((item) => item.area === area);
          if (items.length === 0) return null;
          return (
            <View key={area}>
              <H2>{AREA_LABELS[area]}</H2>
              {items.map((item) => {
                const taxonomy = item.taxonomyId ? itemById(item.taxonomyId) : undefined;
                const note = taxonomy ? workNotPaperworkNote(taxonomy) : null;
                return (
                  <Panel key={item.id}>
                    <Body>{item.originalText}</Body>
                    {taxonomy ? <Small>{taxonomy.typicalFix}</Small> : null}
                    {note ? <Small>{note}</Small> : null}
                    {item.legalBasis ? <Small>{item.legalBasis}</Small> : null}
                    <Small>
                      {STATUS_LABEL[item.status]}
                      {item.evidence.length > 0
                        ? ` | ${item.evidence.length} photo${item.evidence.length === 1 ? "" : "s"}, dated ${item.evidence[item.evidence.length - 1]?.capturedAt.slice(0, 10)}`
                        : ""}
                    </Small>

                    {item.evidence.length > 0 ? (
                      <View style={styles.thumbs}>
                        {item.evidence.slice(-3).map((evidence) => (
                          <Image key={evidence.uri} source={{ uri: evidence.uri }} style={styles.thumb} />
                        ))}
                      </View>
                    ) : null}

                    <Button
                      label={busyItem === item.id ? "Opening the camera" : "Photograph the fix"}
                      onPress={() => capture(item)}
                      disabled={busyItem === item.id}
                    />
                    {item.status === "open" ? (
                      <Button label="Mark done" secondary onPress={() => markDone(item)} />
                    ) : null}
                  </Panel>
                );
              })}
            </View>
          );
        })}

        <Button label="Confirm the facts for your paperwork" onPress={() => router.push("/confirm")} />
        <Button label="Readiness check" secondary onPress={() => router.push("/ready")} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  thumbs: { flexDirection: "row", gap: 8, marginTop: 10 },
  thumb: { width: 72, height: 72, borderWidth: 1, borderColor: colors.rule },
});
