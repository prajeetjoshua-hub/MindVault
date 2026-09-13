import { StyleSheet } from "react-native";
import { colors as c } from "../../theme/colors";
export const styles = StyleSheet.create({
  root: { flex: 1 },
  welcome: { alignItems: "center", paddingVertical: 10, gap: 4 },
  mascot: {
    height: 185,
    width: 200,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scale: 0.72 }],
  },
  messages: { padding: 20, gap: 14, flexGrow: 1 },
  bubble: {
    backgroundColor: c.surface,
    borderRadius: 18,
    padding: 16,
    gap: 7,
    maxWidth: "96%",
  },
  user: { alignSelf: "flex-end", backgroundColor: c.elevated },
  companion: { alignSelf: "flex-start" },
  text: { color: c.text, fontSize: 15, lineHeight: 24 },
  composer: { padding: 14, borderTopWidth: 1, borderColor: c.border, gap: 10 },
  input: { maxHeight: 150, minHeight: 56, textAlignVertical: "top" },
  tools: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  help: { borderColor: c.danger, borderWidth: 1 },
});
