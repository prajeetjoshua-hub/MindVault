import React, { useEffect, useRef } from "react";
import { Platform, ScrollView, Text, TextInput, View } from "react-native";
import type { Message } from "../../../../packages/contracts/types";
import Squirrel from "../../../../src/components/Squirrel";
import { Button } from "../../components/Button";
import { ui } from "../../components/ui.styles";
import { styles as s } from "./CompanionScreen.styles";
import { colors } from "../../theme/colors";
type Props = {
  messages: Message[];
  draft: string;
  setDraft: (value: string) => void;
  send: () => void;
  busy: boolean;
  stop: () => void;
  help: () => void;
  localModelReady: boolean;
  modelName: string;
  saveChat: () => void;
};
export function CompanionScreen(p: Props) {
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    scroll.current?.scrollToEnd({ animated: true });
  }, [p.messages.length]);
  return (
    <View style={s.root}>
      <View
        accessibilityLiveRegion="polite"
        style={[s.modelStatus, p.localModelReady && s.modelConnected]}
      >
        <View
          style={[s.statusDot, p.localModelReady && s.statusDotConnected]}
        />
        <Text style={s.modelStatusText}>
          {p.localModelReady
            ? `${p.modelName.startsWith("qwen3") ? "Qwen3 4B" : "Local model"} connected · replies stay on this computer`
            : "Deterministic engine active · Qwen is not connected"}
        </Text>
      </View>
      <ScrollView
        ref={scroll}
        contentContainerStyle={s.messages}
        keyboardShouldPersistTaps="handled"
      >
        {!p.messages.length && (
          <View style={s.welcome}>
            <View style={s.mascot}>
              <Squirrel />
            </View>
            <Text style={ui.title}>A little space to be you.</Text>
            <Text style={ui.body}>
              Tell me what’s on your mind. We can take it one small step at a
              time.
            </Text>
            <Text style={ui.small}>
              Experimental self-help prototype · English
            </Text>
          </View>
        )}
        {p.messages.map((m) => (
          <View
            key={m.id}
            style={[
              s.bubble,
              m.role === "user" ? s.user : s.companion,
              m.route === "SAFETY" && s.help,
            ]}
          >
            <Text style={ui.tag}>
              {m.role === "user" ? "YOU" : "YOUR COMPANION"}
            </Text>
            <Text selectable style={s.text}>
              {m.text}
            </Text>
            {m.role === "companion" && (
              <Text style={s.sourceLabel}>
                {m.source === "local-model"
                  ? "LOCAL QWEN REPLY"
                  : "DETERMINISTIC REPLY"}
              </Text>
            )}
            {m.route === "SAFETY" && (
              <Button title="Help & support" onPress={p.help} />
            )}
          </View>
        ))}
        {p.busy && (
          <View
            accessibilityLabel="Your companion is preparing a reply"
            accessibilityLiveRegion="polite"
            style={[s.bubble, s.companion, s.typingBubble]}
          >
            <Text style={ui.tag}>YOUR COMPANION</Text>
            <Text style={s.typingDots}>•••</Text>
          </View>
        )}
      </ScrollView>
      <View style={s.composer}>
        <TextInput
          accessibilityLabel="Message your companion"
          placeholder="You can start anywhere…"
          placeholderTextColor={colors.muted}
          value={p.draft}
          onChangeText={p.setDraft}
          multiline
          onKeyPress={Platform.OS === 'web' ? (event) => {
            const key = event.nativeEvent as typeof event.nativeEvent & { shiftKey?: boolean; isComposing?: boolean; keyCode?: number };
            if (key.key === 'Enter' && !key.shiftKey && !key.isComposing && key.keyCode !== 229) {
              event.preventDefault();
              if (!p.busy && p.draft.trim()) p.send();
            }
          } : undefined}
          style={[ui.input, s.input]}
        />
        <View style={s.tools}>
          <Button
            title="Save this chat"
            secondary
            disabled={!p.messages.length || p.busy}
            onPress={p.saveChat}
          />
          {p.busy ? (
            <Button title="Stop" secondary onPress={p.stop} />
          ) : (
            <Button
              title="Send →"
              onPress={p.send}
              disabled={!p.draft.trim()}
            />
          )}
        </View>
      </View>
    </View>
  );
}
