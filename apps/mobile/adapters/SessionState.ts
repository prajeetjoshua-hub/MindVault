import type { Conversation, Message, Preferences } from "../../../packages/contracts/types";

export type SessionState = {
  entered: boolean;
  page: string;
  draft: string;
  messages: Message[];
  pendingConversation?: Conversation;
  turnGoal?: Preferences["goal"];
  savedChatsUnlocked: boolean;
};

export function loadSessionState(): Partial<SessionState> {
  return {};
}

export function saveSessionState(_state: SessionState) {}
export function clearSessionState() {}
