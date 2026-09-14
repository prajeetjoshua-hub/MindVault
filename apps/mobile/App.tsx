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
import * as Crypto from "expo-crypto";
import {
  emptyData,
  type AppData,
  type Conversation,
  type Message,
  type TraceEvent,
} from "../../packages/contracts/types";
import { ConversationOrchestrator } from "../../packages/pipeline/ConversationOrchestrator";
import {
  createSavedChatsLock,
  verifySavedChatsPassword,
} from "../../packages/security/savedChatsPasscode.ts";
import {
  deleteConversation,
  forgetMemory,
} from "../../packages/storage/memoryOperations";
import { MonitorClient } from "../../packages/diagnostics/MonitorClient";
import { Vault } from "./adapters/Vault";
import { LocalModel } from "./adapters/LocalModel";
import {
  clearSessionState,
  loadSessionState,
  saveSessionState,
} from "./adapters/SessionState";
import { exportChat } from "./adapters/exportChat";
import { CompanionScreen } from "./screens/Companion/CompanionScreen";
import { HomeScreen } from "./screens/Home/HomeScreen";
import { HelpScreen } from "./screens/Help/HelpScreen";
import { CheckInScreen } from "./screens/CheckIn/CheckInScreen";
import { HistoryScreen } from "./screens/History/HistoryScreen";
import { SettingsScreen } from "./screens/Settings/SettingsScreen";
import { Button } from "./components/Button";
import { ui } from "./components/ui.styles";
import { installWebTheme } from "./theme/installWebTheme";
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
export default function App() {
  useEffect(() => {
    if (Platform.OS === "web") installWebTheme();
  }, []);

  const restored = useMemo(loadSessionState, []);
  const [turnGoal, setTurnGoal] = useState<
    AppData["preferences"]["goal"] | undefined
  >(restored.turnGoal);
  const [locked, setLocked] = useState(!(restored.entered ?? false)),
    [data, setData] = useState<AppData>(emptyData),
    [page, setPage] = useState(restored.page ?? "Home");
  const [draft, setDraft] = useState(restored.draft ?? ""),
    [messages, setMessages] = useState<Message[]>(restored.messages ?? []),
    [pendingConversation, setPendingConversation] =
      useState<Conversation | undefined>(restored.pendingConversation),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [savedChatsUnlocked, setSavedChatsUnlocked] = useState(
    restored.savedChatsUnlocked ?? false,
  );
  const [connection, setConnection] = useState("Disconnected"),
    [modelStatus, setModelStatus] = useState(
      "Qwen is not connected. Deterministic replies remain active.",
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
  };
  const engine = useMemo(
    () => new ConversationOrchestrator(emit, model),
    [model, monitor],
  );
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (restored.messages?.length) engine.restore(restored.messages);
    void vault.load().then((next) => {
      dataRef.current = next;
      setData(next);
    });
    monitor.restore?.();
    if (model.autoConnect) {
      void model.autoConnect().then((connected) => {
        if (connected)
          setModelStatus("Qwen3 4B is connected locally and ready.");
      });
    }
  }, [engine, model, monitor, vault]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    saveSessionState({
      entered: !locked,
      page,
      draft,
      messages,
      pendingConversation,
      turnGoal,
      savedChatsUnlocked,
    });
  }, [locked, page, draft, messages, pendingConversation, turnGoal, savedChatsUnlocked]);
  useEffect(() => {
    if (Platform.OS !== "web" || typeof location === "undefined") return;
    const pairing = new URLSearchParams(location.hash.slice(1)).get("dashboard");
    if (!pairing) return;
    try {
      monitor.connect(pairing);
      history.replaceState(null, "", `${location.pathname}${location.search}`);
    } catch (e) {
      setConnection(e instanceof Error ? e.message : "Unable to pair");
    }
  }, [monitor]);
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
        if (Platform.OS !== "web" && model.autoConnect) {
          setModelStatus("Connecting the previously imported local model…");
          void model
            .autoConnect()
            .then((connected) =>
              setModelStatus(
                connected
                  ? `${model.modelName.startsWith("qwen3") ? "Qwen3 4B" : "Local model"} connected automatically and ready.`
                  : "No imported local model found. Deterministic replies remain active.",
              ),
            )
            .catch(() =>
              setModelStatus(
                "The saved local model could not start. Deterministic replies remain active.",
              ),
            );
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to unlock");
    }
  };
  useEffect(() => {
    if (Platform.OS === "web")
      return () => {
        engine.cancel();
        monitor.disconnect(false);
        void model.release();
      };
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
        setPendingConversation(undefined);
        setDraft("");
        setTurnGoal(undefined);
        setSavedChatsUnlocked(false);
        setError("");
        setModelStatus(
          "The local model disconnected when MindVault locked. Deterministic replies remain active.",
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
      emit({
        traceId: result.traceId,
        sequence: result.nextSequence,
        timestamp: new Date().toISOString(),
        layer: "storage",
        status: "skipped",
        details: {
          saved: false,
          persistent: vault.persistent,
          action: "manual-save-required",
        },
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
      }
    }
  };
  const stop = () => {
    engine.cancel();
  };
  const currentConversation = (): Conversation | undefined =>
    messages.length
      ? {
          id: conversationId.current,
          title: messages[0].text.slice(0, 55),
          messages: [...messages],
          updatedAt: new Date().toISOString(),
        }
      : undefined;
  const upsertConversation = async (conversation: Conversation) =>
    persist({
      ...dataRef.current,
      conversations: [
        conversation,
        ...dataRef.current.conversations.filter(
          (item) => item.id !== conversation.id,
        ),
      ],
    });
  const createSavedPassword = async (password: string) => {
    const salt = Array.from(Crypto.getRandomBytes(16), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    const savedChatsLock = await createSavedChatsLock(password, salt);
    return persist({ ...dataRef.current, savedChatsLock });
  };
  const verifySavedPassword = (password: string) => {
    const savedChatsLock = dataRef.current.savedChatsLock;
    return savedChatsLock
      ? verifySavedChatsPassword(password, savedChatsLock)
      : Promise.resolve(false);
  };
  const savePending = async () => {
    const conversation = pendingConversation;
    if (!conversation || !dataRef.current.savedChatsLock) return false;
    const saved = await upsertConversation(conversation);
    if (saved) setPendingConversation(undefined);
    return saved;
  };
  const removeAll = async (password?: string) => {
    try {
      if (
        dataRef.current.savedChatsLock &&
        !savedChatsUnlocked &&
        !(password && (await verifySavedPassword(password)))
      ) {
        setError("Enter the saved-chats password before deleting local data.");
        return false;
      }
      if (!(await vault.unlock())) return false;
      generation.current++;
      engine.reset();
      monitor.disconnect();
      await model.release();
      await vault.destroy();
      traces.current = [];
      setData(emptyData());
      dataRef.current = emptyData();
      setMessages([]);
      setPendingConversation(undefined);
      setDraft("");
      setLocked(true);
      setBusy(false);
      setSavedChatsUnlocked(false);
      clearSessionState();
      conversationId.current = id();
      return true;
    } catch {
      setError(
        "Deletion did not complete. Please retry before closing the app.",
      );
      return false;
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
                Desktop functional preview · browser-session storage · native
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
                    ? "Use invented scenarios here. Your current chat and draft remain while this browser tab is open, including after a reload. Closing the tab clears the session."
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
              {page === "Home" && (
                <HomeScreen
                  open={setPage}
                  savedCount={data.conversations.length}
                />
              )}
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
                  stop={stop}
                  help={() => setPage("Help")}
                  modelName={model.modelName ?? "Local model"}
                  saveChat={() => {
                    const conversation = currentConversation();
                    if (!conversation) return;
                    if (savedChatsUnlocked && dataRef.current.savedChatsLock) {
                      void upsertConversation(conversation);
                      setPage("Saved chats");
                      return;
                    }
                    setPendingConversation(conversation);
                    setPage("Saved chats");
                  }}
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
              {page === "Saved chats" && (
                <HistoryScreen
                  conversations={data.conversations}
                  lock={data.savedChatsLock}
                  pendingConversation={pendingConversation}
                  persistent={vault.persistent}
                  unlocked={savedChatsUnlocked}
                  onUnlocked={() => setSavedChatsUnlocked(true)}
                  onCreatePassword={createSavedPassword}
                  onVerifyPassword={verifySavedPassword}
                  onSavePending={savePending}
                  onDelete={(cid) => {
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
                      setError("");
                      return true;
                    } catch (e) {
                      setConnection(
                        e instanceof Error ? e.message : "Unable to pair",
                      );
                      return false;
                    }
                  }}
                  disconnect={() => monitor.disconnect()}
                  connection={connection}
                  modelStatus={modelStatus}
                  modelReady={model.ready()}
                  importModel={(sessionToken) => {
                    void model
                      .importFile(sessionToken)
                      .then(() => {
                        setModelStatus(
                          model.modelName.startsWith("qwen3")
                            ? "Qwen3 4B is connected locally and ready for eligible replies."
                            : "The verified local model is connected and ready.",
                        );
                      })
                      .catch((e) => setModelStatus(e.message));
                  }}
                  onHelp={() => setPage("Help")}
                />
              )}
              {page === "Help" && <HelpScreen />}
              <View style={ui.nav}>
                {["Home", "Companion", "Check-in", "Saved chats", "Settings"].map(
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
