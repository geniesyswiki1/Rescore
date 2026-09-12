import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { areas, gapTo, heroSentence, ratingFor, type Rating } from "@rescore/content/scoring";
import { Bar, Body, Button, H1, H2, Panel, Screen, Small } from "@/components/ui";
import { useCases } from "@/lib/store";
import { colors } from "@/lib/theme";

/** The score panel: the three bars and one sentence per area. */
export default function ScoreScreen() {
  const { current } = useCases();
  if (!current) {
    return (
      <Screen>
        <Body>Read a report first.</Body>
      </Screen>
    );
  }

  const scores = current.scoresBefore;
  const target: Rating = scores && ratingFor(scores).rating >= 3 ? 5 : 3;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {current.hardStops.length > 0 ? (
          <Panel>
            <H2>Read this first</H2>
            <Body>
              Some of this needs to be fixed before any paperwork matters, and some of it may need a
              specialist. Come back when it is done; your case will be waiting.
            </Body>
            {current.hardStops.map((stop) => (
              <Body key={stop.id}>{stop.original_text}</Body>
            ))}
          </Panel>
        ) : null}

        {scores ? (
          <>
            <H1>
              Rating {ratingFor(scores).rating}. {ratingFor(scores).descriptor}.
            </H1>
            <Panel>
              {areas.map((area) => {
                const gap = gapTo(scores, target).areas.find((a) => a.key === area.key);
                return (
                  <View key={area.key} style={{ marginBottom: 16 }}>
                    <Small>
                      {area.shortLabel}: {scores[area.key]}
                      {gap?.cap === null || gap?.cap === undefined ? "" : ` to ${gap.cap} for a ${target}`}
                    </Small>
                    <Bar value={scores[area.key]} worst={area.worst} cap={gap?.cap ?? null} />
                  </View>
                );
              })}
            </Panel>

            {areas.map((area) => (
              <Body key={area.key} style={{ marginTop: 12 }}>
                {heroSentence(scores, area.key)}
              </Body>
            ))}
          </>
        ) : (
          <>
            <H1>{current.items.length} items from your report</H1>
            <Body>
              Your report did not give the three scores. They are on the letter that came with the rating, if
              you have it.
            </Body>
          </>
        )}

        <H2>What the officer wrote down</H2>
        {current.items.map((item) => (
          <Body key={item.id} style={{ marginTop: 8, color: colors.ink }}>
            {item.originalText}
          </Body>
        ))}

        <Button label="Build my re-rating pack" onPress={() => router.push("/paywall")} />
      </ScrollView>
    </Screen>
  );
}
