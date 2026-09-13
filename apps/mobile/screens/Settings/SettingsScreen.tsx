import React, { useState } from "react";
import { Platform, ScrollView, Switch, Text, TextInput, View } from "react-native";
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
  deleteAll: () => void;
  connect: (json: string) => void;
  disconnect: () => void;
  connection: string;
  modelStatus: string;
  importModel: (sessionToken?: string) => void;
  onHelp: () => void;
};
export function SettingsScreen(p: Props) {
  const [page, setPage] = useState("menu"),
    [memory, setMemory] = useState(""),
    [pairing, setPairing] = useState(""),
    [modelToken, setModelToken] = useState(""),
    [confirm, setConfirm] = useState(false);
  const pref = p.data.preferences;
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
          <View style={ui.row}>
            <Text style={ui.body}>Keep conversation history</Text>
            <Switch
              accessibilityLabel="Keep conversation history"
              value={pref.saveHistory}
              onValueChange={(saveHistory) =>
                p.onPreferences({ ...pref, saveHistory })
              }
            />
          </View>
          <Text style={ui.small}>
            Off by default. Turning this off stops future saves; use Journal to
            delete existing entries.
          </Text>
          {confirm ? (
            <View style={ui.card}>
              <Text style={ui.body}>
                Delete all local history, memories, preferences and diagnostic
                traces? Exported copies are outside the app’s control.
              </Text>
              <Button
                title="Delete all local data"
                onPress={() => {
                  p.deleteAll();
                  setConfirm(false);
                }}
              />
              <Button
                title="Cancel"
                secondary
                onPress={() => setConfirm(false)}
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
          <View style={ui.card}>
            <Text style={ui.cardTitle}>{Platform.OS === 'web' ? 'Desktop conversation model' : 'Local Gemma 3 1B'}</Text>
            <Text style={ui.body}>{p.modelStatus}</Text>
            <Text style={ui.small}>
              {Platform.OS === 'web' ? 'Connect a verified local runtime on this computer. ' : 'Official Q4_0 artifact. Import only after accepting its licence. '}
              No cloud fallback. Model availability does not mean clinically
              validated output.
            </Text>
            {Platform.OS === 'web' && (
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
            <Button
              title={Platform.OS === 'web' ? 'Connect desktop model' : 'Import model file'}
              secondary
              disabled={Platform.OS === 'web' && !modelToken.trim()}
              onPress={() => {
                p.importModel(Platform.OS === 'web' ? modelToken : undefined);
                if (Platform.OS === 'web') setModelToken('');
              }}
            />
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
            Share diagnostic events with your paired laptop. No conversation
            text is sent. This is separate from the public landing page.
          </Text>
          <Text style={ui.small}>{p.connection}</Text>
          <TextInput
            accessibilityLabel="Dashboard pairing configuration"
            multiline
            value={pairing}
            onChangeText={setPairing}
            placeholder="Paste session pairing configuration"
            placeholderTextColor={colors.muted}
            style={ui.input}
          />
          <Button
            title="Pair dashboard"
            onPress={() => {
              p.connect(pairing);
              setPairing("");
            }}
          />
          <Button title="Disconnect" secondary onPress={p.disconnect} />
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
