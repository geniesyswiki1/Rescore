import { useState } from "react";
import { ScrollView, StyleSheet, TextInput } from "react-native";
import { router } from "expo-router";
import { Body, Button, H1, H2, Panel, Screen, Small } from "@/components/ui";
import { classifyReport } from "@/lib/api";
import { useCases } from "@/lib/store";
import { colors, radius } from "@/lib/theme";

/** Start: read my report. Free, and before any paywall. */
export default function StartScreen() {
  const { startCase, cases } = useCases();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function read() {
    setBusy(true);
    setError(null);
    try {
      const classification = await classifyReport(text);
      await startCase({ reportText: text, classification });
      router.push("/score");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "We could not read that report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <H1>Rated 0, 1 or 2? Here is exactly what to fix, prove and send back.</H1>
        <Body>
          Read your inspection report for free. See what each area cost you in points and what the officer
          wants to see next time.
        </Body>

        <Panel>
          <Small>Type or paste the officer&apos;s list of items</Small>
          <TextInput
            style={styles.input}
            multiline
            value={text}
            onChangeText={setText}
            placeholder="Paste the text of your inspection report and the officer's letter here."
            placeholderTextColor={colors.muted}
          />
          <Small>Nothing is stored until you start a case.</Small>
          <Button
            label={busy ? "Reading your report" : "Read my report"}
            onPress={read}
            disabled={busy || text.trim().length < 40}
          />
        </Panel>

        {error ? <Body style={{ marginTop: 12 }}>{error}</Body> : null}

        {cases.length > 0 ? (
          <>
            <H2>Already started</H2>
            <Button label="Your cases" secondary onPress={() => router.push("/cases")} />
          </>
        ) : null}
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
    minHeight: 160,
    textAlignVertical: "top",
    marginVertical: 8,
    fontSize: 15,
  },
});
