import type { AppData } from "../contracts/types.ts";
export function deleteConversation(data: AppData, id: string): AppData {
  return {
    ...data,
    conversations: data.conversations.filter((c) => c.id !== id),
    memories: data.memories.filter((m) => m.sourceConversationId !== id),
  };
}
export function forgetMemory(data: AppData, id: string): AppData {
  return { ...data, memories: data.memories.filter((m) => m.id !== id) };
}
