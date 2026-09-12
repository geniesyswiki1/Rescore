/** The six tokens from spec 2.4, and nothing else. */
export const colors = {
  tile: "#F4F6F5",
  ink: "#171A19",
  rule: "#CFD6D2",
  muted: "#66706B",
  done: "#0F7B4B",
  open: "#C25A16",
} as const;

export const type = {
  display: { fontSize: 30, fontWeight: "700" as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: "700" as const, lineHeight: 26 },
  body: { fontSize: 17, lineHeight: 26 },
  ui: { fontSize: 15, lineHeight: 22 },
  small: { fontSize: 14, lineHeight: 20, color: colors.muted },
};

export const radius = 6;
