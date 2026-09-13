export type Route = "LOW" | "MEDIUM" | "SAFETY" | "CLARIFY";
export type Topic =
  | "exam"
  | "work"
  | "relationships"
  | "family"
  | "loneliness"
  | "sleep"
  | "general";
export type Evidence = {
  id: string;
  start: number;
  end: number;
  contribution: number;
  category: "support" | "safety" | "uncertainty";
};
export type Decision = {
  route: Route;
  score: number;
  contributions: Record<string, number>;
  reasons: string[];
  policyVersion: string;
  topic: Topic;
  evidence: Evidence[];
};
export type TraceEvent = {
  traceId: string;
  sequence: number;
  timestamp: string;
  layer: string;
  status: "started" | "completed" | "skipped" | "failed";
  durationMs?: number;
  details: Record<string, string | number | boolean | string[]>;
};
export type Preferences = {
  detail: "brief" | "balanced";
  style: "gentle" | "direct";
  goal: "listen" | "reflect" | "plan";
  saveHistory: boolean;
};
export type Memory = {
  id: string;
  text: string;
  createdAt: string;
  sourceConversationId?: string;
};
export type Message = {
  id: string;
  role: "user" | "companion";
  text: string;
  createdAt: string;
  route?: Route;
  source?: "template" | "local-model";
};
export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
};
export type AppData = {
  version: 1;
  conversations: Conversation[];
  memories: Memory[];
  preferences: Preferences;
};
export type ModelRequest = {
  turns?: { role: 'user' | 'assistant'; content: string }[];
  input: string;
  context: string;
  instruction: string;
  signal: AbortSignal;
};
export interface ModelAdapter {
  modelName?: string;
  ready(): boolean;
  generate(request: ModelRequest): Promise<string>;
  cancel(): Promise<void>;
}
export const defaultPreferences: Preferences = {
  detail: "brief",
  style: "gentle",
  goal: "reflect",
  saveHistory: false,
};
export const emptyData = (): AppData => ({
  version: 1,
  conversations: [],
  memories: [],
  preferences: { ...defaultPreferences },
});
