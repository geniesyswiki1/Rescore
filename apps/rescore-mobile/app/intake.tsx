import { ScrollView, Switch, TextInput, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Body, Button, H1, H2, Panel, Screen, Small } from "@/components/ui";
import { useCases, type KitchenProfileState } from "@/lib/store";
import { colors, radius } from "@/lib/theme";

const QUESTIONS: Array<{ key: keyof KitchenProfileState; label: string; why: string }> = [
  { key: "cooks", label: "We cook food from raw", why: "The officer asks how you know it is cooked through." },
  { key: "cools", label: "We cook food and keep it for later", why: "Cooling is where most kitchens lose points." },
  { key: "reheats", label: "We reheat cooked food", why: "The officer will ask what temperature you reheat to." },
  { key: "hotHolds", label: "We hold food hot for service", why: "Hot holding needs a record, not just a setting." },
  { key: "freezes", label: "We freeze or defrost food", why: "Defrosting is a safe method the officer looks for." },
];

/** Intake. Each question shows why the officer asks. */
export default function IntakeScreen() {
  const { current, update } = useCases();
  if (!current) {
    return (
      <Screen>
        <Body>Read a report first.</Body>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <H1>Your kitchen</H1>
        <Body>This decides which safe methods your pack needs. Nothing is assumed.</Body>

        <Panel>
          <Small>Business name, as it appears on the report</Small>
          <TextInput
            style={styles.input}
            value={current.businessName}
            onChangeText={(value) => update(current.id, (previous) => ({ ...previous, businessName: value }))}
            placeholder="The name above the door"
            placeholderTextColor={colors.muted}
          />
        </Panel>

        <H2>What happens in this kitchen</H2>
        {QUESTIONS.map((question) => (
          <View key={question.key} style={styles.row}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Body>{question.label}</Body>
              <Small>{question.why}</Small>
            </View>
            <Switch
              value={current.profile[question.key]}
              trackColor={{ true: colors.done, false: colors.rule }}
              onValueChange={(value) =>
                update(current.id, (previous) => ({
                  ...previous,
                  profile: { ...previous.profile, [question.key]: value },
                }))
              }
            />
          </View>
        ))}

        <Button label="On to the action plan" onPress={() => router.push("/plan")} />
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
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingVertical: 14,
  },
});
