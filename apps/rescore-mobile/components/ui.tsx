import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle } from "react-native";
import { colors, radius, type } from "@/lib/theme";

export function Screen({ children }: { children: React.ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function H1({ children }: { children: React.ReactNode }) {
  return <Text style={[styles.text, type.display]}>{children}</Text>;
}

export function H2({ children }: { children: React.ReactNode }) {
  return <Text style={[styles.text, type.h2, { marginTop: 24 }]}>{children}</Text>;
}

export function Body({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.text, type.body, style]}>{children}</Text>;
}

export function Small({ children }: { children: React.ReactNode }) {
  return <Text style={[type.small]}>{children}</Text>;
}

export function Panel({ children }: { children: React.ReactNode }) {
  return <View style={styles.panel}>{children}</View>;
}

export function Button({
  label,
  onPress,
  disabled,
  secondary,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        secondary && styles.buttonSecondary,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={[styles.buttonLabel, secondary && { color: colors.done }]}>{label}</Text>
    </Pressable>
  );
}

/** The three bars. Lower is better, so a full bar is a bad score. */
export function Bar({ value, worst, cap }: { value: number; worst: number; cap: number | null }) {
  const inside = cap === null || value <= cap;
  return (
    <View style={styles.bar}>
      <View
        style={[
          styles.barFill,
          { width: `${Math.round((value / worst) * 100)}%`, backgroundColor: inside ? colors.done : colors.open },
        ]}
      />
      {cap === null ? null : (
        <View style={[styles.barTarget, { left: `${Math.round((cap / worst) * 100)}%` }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.tile, paddingHorizontal: 20 },
  text: { color: colors.ink },
  panel: { borderWidth: 1, borderColor: colors.rule, padding: 16, marginTop: 16 },
  button: {
    backgroundColor: colors.done,
    borderColor: colors.done,
    borderWidth: 1,
    borderRadius: radius,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: "center",
    marginTop: 16,
  },
  buttonSecondary: { backgroundColor: "transparent" },
  buttonDisabled: { opacity: 0.55 },
  buttonLabel: { color: "#fff", fontSize: 15, fontWeight: "500" },
  bar: { height: 10, borderWidth: 1, borderColor: colors.rule, marginTop: 6, position: "relative" },
  barFill: { height: "100%" },
  barTarget: { position: "absolute", top: -3, bottom: -3, width: 1, backgroundColor: colors.ink },
});
