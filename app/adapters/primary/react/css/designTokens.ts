import type { TextStyle } from "react-native";
import { palette } from "./colors";

// Presentation only. Legacy palette aliases remain for screens outside this PR.
export const spacing = { micro: 8, compact: 12, standard: 16, section: 24, airy: 32 } as const;
export const radii = { control: 12, card: 16, sheet: 24, round: 999 } as const;
export const typography = {
  screen: { fontSize: 26, lineHeight: 32, fontWeight: "600" },
  section: { fontSize: 20, lineHeight: 26, fontWeight: "600" },
  card: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
  body: { fontSize: 14, lineHeight: 20, fontWeight: "400" },
} satisfies Record<string, TextStyle>;
export const surfaces = {
  canvas: palette.background,
  card: palette.surface,
  tonal: palette.elevated,
  floating: palette.surface,
  preview: palette.textPrimary,
  previewText: palette.background,
  previewSecondary: "#65554B",
  previewTonal: "#E8DED5",
  previewDanger: "#A53329",
} as const;
export const scrollContentSpacing = { paddingBottom: spacing.standard } as const;
export const compactSheetGeometry = { maxHeightPercent: 58 } as const;
export const tabBarGeometry = { height: 70, minimumInset: 10, bottomGap: 10, contentGap: 12 } as const;
export function tabBarClearance(bottomInset: number) {
  return tabBarGeometry.height + Math.max(bottomInset, tabBarGeometry.minimumInset) + tabBarGeometry.bottomGap + tabBarGeometry.contentGap;
}
export const floatingControl = {
  width: 48, height: 48, borderRadius: radii.round,
  backgroundColor: surfaces.floating, alignItems: "center", justifyContent: "center",
} as const;
