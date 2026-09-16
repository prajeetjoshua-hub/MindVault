import type { Conversation } from "../../../packages/contracts/types";
export async function exportChat(conversation: Conversation) {
  const blob = new Blob(
    [
      conversation.messages
        .map((m) => `${m.role === "user" ? "You" : "Companion"}: ${m.text}`)
        .join("\n\n"),
    ],
    { type: "text/plain;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "MindVault-conversation.txt";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
