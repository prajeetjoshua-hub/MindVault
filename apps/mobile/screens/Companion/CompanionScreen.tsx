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
  progress: string;
  stop: () => void;
  help: () => void;
  localModelReady: boolean;
};
export function CompanionScreen(p: Props) {
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    scroll.current?.scrollToEnd({ animated: true });
  }, [p.messages.length]);
  return (
    <View style={s.root}>
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
            {m.route === "SAFETY" && (
              <Button title="Help & support" onPress={p.help} />
            )}
          </View>
        ))}
        {p.busy && (
          <Text accessibilityLiveRegion="polite" style={ui.body}>
            {p.progress || "Taking a moment with what you shared…"}
          </Text>
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
          <Text style={ui.small}>
            {p.localModelReady
              ? "On-device companion"
              : "Structured reply preview"}
          </Text>
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
