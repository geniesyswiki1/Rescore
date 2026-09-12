import { ScrollView } from "react-native";
import { router } from "expo-router";
import { ratingFor } from "@rescore/content/scoring";
import { Body, Button, H1, Panel, Screen, Small } from "@/components/ui";
import { progress, useCases } from "@/lib/store";

export default function CasesScreen() {
  const { cases, openCase, removeCase } = useCases();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <H1>Your cases</H1>
        {cases.length === 0 ? <Body>Nothing here yet. Read a report to start one.</Body> : null}

        {cases.map((entry) => {
          const state = progress(entry);
          const rating = entry.scoresBefore ? ratingFor(entry.scoresBefore).rating : entry.ratingBefore;
          return (
            <Panel key={entry.id}>
              <Body>{entry.businessName || "Unnamed premises"}</Body>
              <Small>
                {rating === null ? "No rating read" : `Rating ${rating}`} | {state.evidenced} of {state.total}{" "}
                evidenced | started {entry.createdAt.slice(0, 10)}
              </Small>
              <Button
                label="Open"
                onPress={() => {
                  openCase(entry.id);
                  router.push(entry.paid ? "/plan" : "/score");
                }}
              />
              <Button label="Delete this case" secondary onPress={() => removeCase(entry.id)} />
            </Panel>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
