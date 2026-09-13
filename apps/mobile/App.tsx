import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  emptyData,
  type AppData,
  type Conversation,
  type Message,
  type TraceEvent,
} from "../../packages/contracts/types";
import { ConversationOrchestrator } from "../../packages/pipeline/ConversationOrchestrator";
import {
  deleteConversation,
  forgetMemory,
} from "../../packages/storage/memoryOperations";
import { MonitorClient } from "../../packages/diagnostics/MonitorClient";
import { Vault } from "./adapters/Vault";
import { LocalModel } from "./adapters/LocalModel";
import { exportChat } from "./adapters/exportChat";
import { CompanionScreen } from "./screens/Companion/CompanionScreen";
import { HomeScreen } from "./screens/Home/HomeScreen";
import { HelpScreen } from "./screens/Help/HelpScreen";
import { CheckInScreen } from "./screens/CheckIn/CheckInScreen";
import { HistoryScreen } from "./screens/History/HistoryScreen";
import { SettingsScreen } from "./screens/Settings/SettingsScreen";
import { Button } from "./components/Button";
import { ui } from "./components/ui.styles";
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
export default function App() {
  const [turnGoal, setTurnGoal] = useState<AppData["preferences"]["goal"]>();
  const [locked, setLocked] = useState(true),
    [data, setData] = useState<AppData>(emptyData),
    [page, setPage] = useState("Home");
  const [draft, setDraft] = useState(""),
    [messages, setMessages] = useState<Message[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [progress, setProgress] = useState("");
  const [connection, setConnection] = useState("Disconnected"),
    [modelStatus, setModelStatus] = useState(
      "No verified model loaded. Structured support works without it.",
    );
  const vault = useMemo(() => new Vault(), []),
    model = useMemo(() => new LocalModel(), []),
    monitor = useMemo(
      () => new MonitorClient(Platform.OS !== "web", setConnection),
      [],
    );
  const traces = useRef<TraceEvent[]>([]),
    conversationId = useRef(id()),
    dataRef = useRef(data),
    generation = useRef(0);
  const emit = (event: TraceEvent) => {
    traces.current = [...traces.current, event].slice(-1000);
    monitor.send(event);
    if (event.layer === "coverage")
      setProgress(
        `Reading your whole message… ${event.details.processed}/${event.details.total} sections`,
      );
  };
  const engine = useMemo(
    () => new ConversationOrchestrator(emit, model),
    [model, monitor],
  );
  const persist = async (next: AppData) => {
    dataRef.current = next;
    setData(next);
    try {
      await vault.save(next);
      return true;
    } catch {
      setError(
        "Your change could not be saved. Keep the app open and try again.",
      );
      return false;
    }
  };
  const unlock = async () => {
    const turn = generation.current;
    try {
      setError("");
      if (await vault.unlock()) {
        if (turn !== generation.current) {
          await vault.lock();
          return;
        }
        const next = await vault.load();
        dataRef.current = next;
        setData(next);
        setLocked(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to unlock");
    }
  };
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background") {
        generation.current++;
        engine.reset();
        monitor.disconnect();
        traces.current = [];
        conversationId.current = id();
        setBusy(false);
        setLocked(true);
        setMessages([]);
        setDraft("");
        setTurnGoal(undefined);
        setError("");
        setProgress("");
        setModelStatus(
          "Model unloaded when the app locked. Structured support remains available.",
        );
        setData(emptyData());
        dataRef.current = emptyData();
        void vault.lock();
        void model.release();
      }
    });
    return () => {
      sub.remove();
      engine.reset();
      monitor.disconnect();
      void model.release();
    };
  }, [engine, monitor, vault, model]);
  const send = async () => {
    if (!draft.trim() || busy) return;
    const text = draft;
    setDraft("");
    setError("");
    setBusy(true);
    const turn = ++generation.current;
    const user: Message = {
      id: id(),
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };
    const before = [...messages, user];
    setMessages(before);
    try {
      const result = await engine.process(
        text,
        {
          ...dataRef.current.preferences,
          goal: turnGoal ?? dataRef.current.preferences.goal,
        },
        dataRef.current.memories,
      );
      if (turn !== generation.current) return;
      setTurnGoal(undefined);
      const nextMessages: Message[] = [
        ...before,
        {
          id: id(),
          role: "companion",
          text: result.text,
          createdAt: new Date().toISOString(),
          route: result.decision.route,
          source: result.source,
        },
      ];
      setMessages(nextMessages);
      let saved = false;
      if (dataRef.current.preferences.saveHistory) {
        const conversation: Conversation = {
          id: conversationId.current,
          title: nextMessages[0].text.slice(0, 55),
          messages: nextMessages,
          updatedAt: new Date().toISOString(),
        };
        saved = await persist({
          ...dataRef.current,
          conversations: [
            conversation,
            ...dataRef.current.conversations.filter(
              (c) => c.id !== conversation.id,
            ),
          ],
        });
      }
      emit({
        traceId: result.traceId,
        sequence: result.nextSequence,
        timestamp: new Date().toISOString(),
        layer: "storage",
        status: dataRef.current.preferences.saveHistory
          ? saved
            ? "completed"
            : "failed"
          : "skipped",
        details: { saved, persistent: vault.persistent },
      });
    } catch (e) {
      if (turn === generation.current) {
        setDraft(text);
        setError(
          "Processing stopped. Your complete message is still available to retry.",
        );
      }
    } finally {
      if (turn === generation.current) {
        setBusy(false);
        setProgress("");
      }
    }
  };
  const stop = () => {
    engine.cancel();
  };
  const newConversation = () => {
    generation.current++;
    engine.reset();
    setMessages([]);
    setDraft("");
    setBusy(false);
    conversationId.current = id();
  };
  const removeAll = async () => {
    try {
      if (!(await vault.unlock())) return;
      generation.current++;
      engine.reset();
      monitor.disconnect();
      await model.release();
      await vault.destroy();
      traces.current = [];
      setData(emptyData());
      dataRef.current = emptyData();
      setMessages([]);
      setDraft("");
      setLocked(true);
      setBusy(false);
      conversationId.current = id();
    } catch {
      setError(
        "Deletion did not complete. Please retry before closing the app.",
      );
    }
  };
  return (
    <SafeAreaProvider>
      <SafeAreaView style={ui.safe}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          style={ui.shell}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={ui.header}>
            <Text style={ui.brand}>
              MindVault<Text style={ui.tag}>.</Text>
            </Text>
            <Text style={ui.tag}>QUIET FOREST</Text>
          </View>
          {Platform.OS === "web" && (
            <View style={ui.banner}>
              <Text style={ui.small}>
                Desktop functional preview · session memory only · native
                features unavailable
              </Text>
            </View>
          )}
          {!!error && (
            <View style={ui.banner}>
              <Text accessibilityLiveRegion="polite" style={ui.error}>
                {error}
              </Text>
            </View>
          )}
          {locked ? (
            <ScrollView contentContainerStyle={ui.content}>
              <Text style={ui.title}>Your space, protected.</Text>
              <Text style={ui.body}>
                An experimental self-help companion for ages 13 and up. No
                account needed. No medical advice or emergency monitoring.
              </Text>
              <View style={ui.card}>
                <Text style={ui.cardTitle}>
                  {Platform.OS === "web"
                    ? "Local desktop preview"
                    : "Use your device unlock"}
                </Text>
                <Text style={ui.body}>
                  {Platform.OS === "web"
                    ? "Use invented scenarios here. This preview does not store your conversation after reload."
                    : "Your phone verifies access. MindVault never sees your phone password. A native build with SQLCipher is required."}
                </Text>
              </View>
              <Button
                title={
                  Platform.OS === "web"
                    ? "Enter desktop preview"
                    : "Unlock MindVault"
                }
                onPress={unlock}
              />
            </ScrollView>
          ) : (
            <>
              {page === "Home" && <HomeScreen open={setPage} />}
              {page === "Voice" && (
                <ScrollView contentContainerStyle={ui.content}>
                  <Text style={ui.title}>Your voice belongs here, too.</Text>
                  <Text style={ui.body}>
                    Offline speech input is still being prepared. Voice
                    recording is not enabled in this build.
                  </Text>
                  <Button
                    title="Type with your companion"
                    onPress={() => setPage("Companion")}
                  />
                  <Button
                    title="Try a guided check-in"
                    secondary
                    onPress={() => setPage("Check-in")}
                  />
                </ScrollView>
              )}
              {page === "Companion" && (
                <CompanionScreen
                  localModelReady={model.ready()}
                  messages={messages}
                  draft={draft}
                  setDraft={setDraft}
                  send={send}
                  busy={busy}
                  progress={progress}
                  stop={stop}
                  help={() => setPage("Help")}
                />
              )}
              {page === "Check-in" && (
                <CheckInScreen
                  onComplete={(text, goal) => {
                    setTurnGoal(goal);
                    setDraft(text);
                    setPage("Companion");
                  }}
                />
              )}
              {page === "Journal" && (
                <HistoryScreen
                  conversations={data.conversations}
                  onDelete={(cid) => {
                    newConversation();
                    void persist(deleteConversation(dataRef.current, cid));
                  }}
                  onExport={(c) => {
                    void exportChat(c).catch(() =>
                      setError("Export could not be completed."),
                    );
                  }}
                />
              )}
              {page === "Settings" && (
                <SettingsScreen
                  data={data}
                  persistent={vault.persistent}
                  onPreferences={(preferences) => {
                    void persist({ ...dataRef.current, preferences });
                  }}
                  addMemory={(text) => {
                    void persist({
                      ...dataRef.current,
                      memories: [
                        ...dataRef.current.memories,
                        { id: id(), text, createdAt: new Date().toISOString() },
                      ],
                    });
                  }}
                  forget={(mid) => {
                    engine.cancel();
                    void persist(forgetMemory(dataRef.current, mid));
                  }}
                  deleteAll={removeAll}
                  connect={(json) => {
                    try {
                      monitor.connect(json);
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : "Unable to pair",
                      );
                    }
                  }}
                  disconnect={() => monitor.disconnect()}
                  connection={connection}
                  modelStatus={modelStatus}
                  importModel={(sessionToken) => {
                    void model
                      .importFile(sessionToken)
                      .then(() =>
                        setModelStatus("Verified model loaded locally"),
                      )
                      .catch((e) => setModelStatus(e.message));
                  }}
                  onHelp={() => setPage("Help")}
                />
              )}
              {page === "Help" && <HelpScreen />}
              <View style={ui.nav}>
                {["Home", "Companion", "Check-in", "Journal", "Settings"].map(
                  (item) => (
                    <Pressable
                      accessibilityRole="tab"
                      accessibilityState={{ selected: page === item }}
                      key={item}
                      onPress={() => setPage(item)}
                      style={[ui.navItem, page === item && ui.selected]}
                    >
                      <Text
                        style={[ui.navText, page === item && ui.selectedText]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
