import React, { useState } from "react";
import { Platform, ScrollView, Text, TextInput, View } from "react-native";
import type {
  AppData,
  Preferences,
} from "../../../../packages/contracts/types";
import { Button } from "../../components/Button";
import { ui } from "../../components/ui.styles";
import { colors } from "../../theme/colors";
type Props = {
  data: AppData;
  persistent: boolean;
  onPreferences: (p: Preferences) => void;
  addMemory: (text: string) => void;
  forget: (id: string) => void;
  deleteAll: (password?: string) => Promise<boolean>;
  connect: (json: string) => boolean;
  disconnect: () => void;
  connection: string;
  modelStatus: string;
  modelReady: boolean;
  importModel: (sessionToken?: string) => void;
  onHelp: () => void;
};
export function SettingsScreen(p: Props) {
  const [page, setPage] = useState("menu"),
    [memory, setMemory] = useState(""),
    [pairing, setPairing] = useState(""),
    [modelToken, setModelToken] = useState(""),
    [deletePassword, setDeletePassword] = useState(""),
    [deleteError, setDeleteError] = useState(""),
    [confirm, setConfirm] = useState(false);
  const pref = p.data.preferences;
  const dashboardConnected =
    p.connection.startsWith("Paired") || p.connection.startsWith("Connected");
  return (
    <ScrollView
      contentContainerStyle={ui.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={ui.title}>
        {page === "menu" ? "Make this your space" : page}
      </Text>
      {page !== "menu" && (
        <Button title="← Settings" secondary onPress={() => setPage("menu")} />
      )}
      {page === "menu" && (
        <>
          {p.modelReady && (
            <View style={ui.connectedCard}>
              <Text style={ui.connectedText}>QWEN CONNECTED</Text>
            </View>
          )}
          {dashboardConnected && (
            <View style={ui.connectedCard}>
              <Text style={ui.connectedText}>DASHBOARD CONNECTED</Text>
            </View>
          )}
          {[
            "Reply preferences",
            "Your memories",
            "Privacy & security",
            "Model & voice",
            "Demo connection",
            "About",
          ].map((value) => (
            <Button
              title={value}
              key={value}
              secondary
              onPress={() => setPage(value)}
            />
          ))}
          <Button title="Help & support" secondary onPress={p.onHelp} />
        </>
      )}
      {page === "Reply preferences" && (
        <>
          <Text style={ui.body}>
            These choices shape wording. They never change safety routing or
            train the model.
          </Text>
          <Text style={ui.cardTitle}>Reply length</Text>
          <View style={ui.row}>
            {(["brief", "balanced"] as const).map((detail) => (
              <Button
                key={detail}
                title={detail}
                secondary={pref.detail !== detail}
                onPress={() => p.onPreferences({ ...pref, detail })}
              />
            ))}
          </View>
          <Text style={ui.cardTitle}>What helps most?</Text>
          <View style={ui.row}>
            {(["listen", "reflect", "plan"] as const).map((goal) => (
              <Button
                key={goal}
                title={goal}
                secondary={pref.goal !== goal}
                onPress={() => p.onPreferences({ ...pref, goal })}
              />
            ))}
          </View>
          <Text style={ui.cardTitle}>Tone</Text>
          <View style={ui.row}>
            {(["gentle", "direct"] as const).map((style) => (
              <Button
                key={style}
                title={style}
                secondary={pref.style !== style}
                onPress={() => p.onPreferences({ ...pref, style })}
              />
            ))}
          </View>
        </>
      )}
      {page === "Your memories" && (
        <>
          <Text style={ui.body}>
            Only details you explicitly add here become personalisation
            memories. You can remove them at any time.
          </Text>
          <TextInput
            accessibilityLabel="Memory to remember"
            value={memory}
            onChangeText={setMemory}
            style={ui.input}
            placeholder="For example: short steps help me"
            placeholderTextColor={colors.muted}
          />
          <Button
            title="Remember this"
            disabled={!memory.trim()}
            onPress={() => {
              p.addMemory(memory.trim());
              setMemory("");
            }}
          />
          {p.data.memories.map((m) => (
            <View style={ui.card} key={m.id}>
              <Text style={ui.body}>{m.text}</Text>
              <Button title="Forget" secondary onPress={() => p.forget(m.id)} />
            </View>
          ))}
        </>
      )}
      {page === "Privacy & security" && (
        <>
          <View style={ui.card}>
            <Text style={ui.cardTitle}>
              {p.persistent
                ? "Encrypted device vault"
                : "Desktop session preview"}
            </Text>
            <Text style={ui.body}>
              {p.persistent
                ? "System authentication is required. Storage refuses to open unless SQLCipher is available. Device security still requires physical-device verification."
                : "This browser version keeps data in memory only. Native unlock and encrypted storage must be tested on Android."}
            </Text>
          </View>
          <View style={ui.card}>
            <Text style={ui.cardTitle}>Saved chats are always optional</Text>
            <Text style={ui.body}>
              Conversations are kept only when you press Save this chat. A
              four-digit PIN is created once. The native app then relies on the
              phone owner’s system authentication; the desktop preview asks
              once per browser session.
            </Text>
          </View>
          {confirm ? (
            <View style={ui.card}>
              <Text style={ui.body}>
                Delete all local history, memories, preferences and diagnostic
                traces? Exported copies are outside the app’s control.
              </Text>
              {p.data.savedChatsLock && (
                <TextInput
                  accessibilityLabel="Password to delete all local data"
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Enter saved-chats password"
                  placeholderTextColor={colors.muted}
                  style={ui.input}
                />
              )}
              {!!deleteError && <Text style={ui.error}>{deleteError}</Text>}
              <Button
                title="Delete all local data"
                disabled={Boolean(p.data.savedChatsLock && !deletePassword)}
                onPress={() => {
                  void p.deleteAll(deletePassword).then((deleted) => {
                    if (!deleted) {
                      setDeleteError(
                        "The password was incorrect or deletion could not complete.",
                      );
                      return;
                    }
                    setDeletePassword("");
                    setDeleteError("");
                    setConfirm(false);
                  });
                }}
              />
              <Button
                title="Cancel"
                secondary
                onPress={() => {
                  setConfirm(false);
                  setDeletePassword("");
                  setDeleteError("");
                }}
              />
            </View>
          ) : (
            <Button
              title="Delete all local data…"
              secondary
              onPress={() => setConfirm(true)}
            />
          )}
        </>
      )}
      {page === "Model & voice" && (
        <>
          <View style={p.modelReady ? ui.connectedCard : ui.card}>
            <Text style={ui.cardTitle}>
              {Platform.OS === "web"
                ? "Desktop Qwen connection"
                : "Local conversation model"}
            </Text>
            <Text style={p.modelReady ? ui.connectedText : ui.body}>
              {p.modelReady ? "QWEN CONNECTED" : p.modelStatus}
            </Text>
            <Text style={ui.small}>
              {Platform.OS === "web"
                ? "Connect a verified local runtime on this computer. "
                : "Official Q4_0 artifact. Import only after accepting its licence. "}
              No cloud fallback. Model availability does not mean clinically
              validated output.
            </Text>
            {Platform.OS === "web" && !p.modelReady && (
              <TextInput
                accessibilityLabel="Local model session token"
                value={modelToken}
                onChangeText={setModelToken}
                placeholder="Paste the private local session token"
                placeholderTextColor={colors.muted}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={ui.input}
              />
            )}
            {!p.modelReady && (
              <Button
                title={
                  Platform.OS === "web"
                    ? "Connect desktop model"
                    : "Import model file"
                }
                secondary
                disabled={Platform.OS === "web" && !modelToken.trim()}
                onPress={() => {
                  p.importModel(Platform.OS === "web" ? modelToken : undefined);
                  if (Platform.OS === "web") setModelToken("");
                }}
              />
            )}
          </View>
          <View style={ui.card}>
            <Text style={ui.cardTitle}>Voice input</Text>
            <Text style={ui.body}>
              Not enabled yet. Offline speech recognition must be integrated and
              tested before voice capture is available.
            </Text>
          </View>
        </>
      )}
      {page === "Demo connection" && (
        <>
          <Text style={ui.body}>
            Share a memory-only live trace with this computer’s dashboard,
            including the test message and processing events. This is separate
            from the public landing page.
          </Text>
          {dashboardConnected ? (
            <View style={ui.connectedCard}>
              <Text style={ui.connectedText}>DASHBOARD CONNECTED</Text>
              <Text style={ui.body}>
                {p.connection.startsWith("Connected")
                  ? "Live message traces are active."
                  : "Pairing saved. Your next message will verify the live trace."}
              </Text>
              <Button
                title="Disconnect dashboard"
                secondary
                onPress={p.disconnect}
              />
            </View>
          ) : (
            <>
              <Text style={ui.small}>{p.connection}</Text>
              <TextInput
                accessibilityLabel="Dashboard pairing configuration"
                multiline
                value={pairing}
                onChangeText={setPairing}
                placeholder='Paste the complete {"url":...,"token":...} value'
                placeholderTextColor={colors.muted}
                style={ui.input}
              />
              <Button
                title="Pair dashboard"
                onPress={() => {
                  if (p.connect(pairing)) setPairing("");
                }}
              />
            </>
          )}
          <Text style={ui.small}>
            Native connections require trusted HTTPS. Loopback HTTP is allowed
            only for this computer’s browser preview.
          </Text>
        </>
      )}
      {page === "About" && (
        <>
          <Text style={ui.body}>
            MindVault is an experimental on-device self-help companion. Intended
            for ages 13 and up; suitability for teenagers requires evaluation.
            English is the currently supported prototype language.
          </Text>
          <Text style={ui.body}>
            The deterministic policy is a small authored prototype rule set, not
            a one-lakh vocabulary and not a clinical assessment. It can miss
            context. No one monitors your conversations.
          </Text>
          <Text style={ui.small}>Quiet Forest · prajeetjoshua-hub</Text>
        </>
      )}
    </ScrollView>
  );
}
