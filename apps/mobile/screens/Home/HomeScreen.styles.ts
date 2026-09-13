import { StyleSheet } from "react-native";
export const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: 8 },
  mascot: {
    height: 150,
    width: 250,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scale: 0.65 }],
  },
  center: { textAlign: "center" },
  entries: { gap: 10 },
});
