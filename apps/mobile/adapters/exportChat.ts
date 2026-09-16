import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as LocalAuthentication from "expo-local-authentication";
import type { Conversation } from "../../../packages/contracts/types";
export async function exportChat(conversation: Conversation) {
  const auth = await LocalAuthentication.authenticateAsync({
    promptMessage: "Export selected conversation",
    disableDeviceFallback: false,
  });
  if (!auth.success) return;
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Sharing is not available on this device");
  const path = `${FileSystem.cacheDirectory}MindVault-export.txt`;
  try {
    await FileSystem.writeAsStringAsync(
      path,
      conversation.messages
        .map((m) => `${m.role === "user" ? "You" : "Companion"}: ${m.text}`)
        .join("\n\n"),
    );
    await Sharing.shareAsync(path, {
      mimeType: "text/plain",
      dialogTitle: "Export readable conversation",
    });
  } finally {
    await FileSystem.deleteAsync(path, { idempotent: true });
  }
}
