import React, { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import type {
  Conversation,
  SavedChatsLock,
} from "../../../../packages/contracts/types";
import { Button } from "../../components/Button";
import { ui } from "../../components/ui.styles";
import { colors } from "../../theme/colors";

type Props = {
  conversations: Conversation[];
  lock?: SavedChatsLock;
  pendingConversation?: Conversation;
  persistent: boolean;
  unlocked: boolean;
  onUnlocked: () => void;
  onCreatePassword: (password: string) => Promise<boolean>;
  onVerifyPassword: (password: string) => Promise<boolean>;
  onSavePending: () => Promise<boolean>;
  onDelete: (id: string) => void;
  onExport: (conversation: Conversation) => void;
};

export function HistoryScreen(p: Props) {
  const [password, setPassword] = useState(""),
    [selected, setSelected] = useState<string>(),
    [confirm, setConfirm] = useState<"delete" | "export">(),
    [notice, setNotice] = useState(""),
    [working, setWorking] = useState(false);
  const conversation = p.conversations.find((item) => item.id === selected);

  const unlock = async () => {
    if (working) return;
    setWorking(true);
    setNotice("");
    try {
      const accepted = p.lock
        ? await p.onVerifyPassword(password)
        : await p.onCreatePassword(password);
      if (!accepted) {
        setNotice("That password is incorrect.");
        return;
      }
      p.onUnlocked();
      setPassword("");
      if (p.pendingConversation) {
        const saved = await p.onSavePending();
        setNotice(
          saved ? "Chat saved and protected." : "The chat could not be saved.",
        );
      }
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to unlock saved chats.",
      );
    } finally {
      setWorking(false);
    }
  };

  if (!p.unlocked) {
    return (
      <ScrollView
        contentContainerStyle={ui.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={ui.title}>
          {p.lock ? "Saved chats are locked" : "Protect your saved chats"}
        </Text>
        <Text style={ui.body}>
          {p.lock
            ? "Enter your four-digit MindVault PIN once. Saved chats stay unlocked until this browser session closes."
            : "Create one four-digit MindVault PIN before saving your first conversation. The PIN itself is never stored."}
        </Text>
        {p.pendingConversation && (
          <View style={ui.card}>
            <Text style={ui.cardTitle}>Chat ready to save</Text>
            <Text style={ui.body}>
              Unlock saved chats to protect this conversation.
            </Text>
          </View>
        )}
        <TextInput
          accessibilityLabel={
            p.lock ? "Saved chats PIN" : "Create saved chats PIN"
          }
          value={password}
          onChangeText={(value) => setPassword(value.replace(/\D/g, "").slice(0, 4))}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={4}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={
            p.lock ? "Enter 4-digit PIN" : "Create 4-digit PIN"
          }
          placeholderTextColor={colors.muted}
          style={ui.input}
        />
        {!!notice && <Text style={ui.error}>{notice}</Text>}
        <Button
          title={
            working
              ? "Checking…"
              : p.pendingConversation
                ? p.lock
                  ? "Unlock & save chat"
                  : "Create PIN & save chat"
                : p.lock
                  ? "Unlock saved chats"
                  : "Create PIN"
          }
          disabled={!/^\d{4}$/.test(password) || working}
          onPress={() => void unlock()}
        />
        <Text style={ui.small}>
          {p.persistent
            ? "Saved conversations remain inside the encrypted device vault. Device unlock still protects the whole app."
            : "Desktop preview: saved chats and the unlocked state last only for this browser session. Closing the tab clears them."}
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={ui.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={ui.title}>
        {conversation ? "Your conversation" : "Saved chats"}
      </Text>
      <Text style={ui.body}>
        Conversations are saved only when you press Save this chat. Saved chats
        stay unlocked until this browser session closes.
      </Text>
      {!!notice && <Text style={ui.body}>{notice}</Text>}
      {conversation ? (
        <>
          <Button
            title="Back to saved chats"
            secondary
            onPress={() => {
              setSelected(undefined);
              setConfirm(undefined);
            }}
          />
          {conversation.messages.map((message) => (
            <View style={ui.card} key={message.id}>
              <Text style={ui.tag}>{message.role.toUpperCase()}</Text>
              <Text selectable style={ui.body}>
                {message.text}
              </Text>
            </View>
          ))}
          {confirm ? (
            <View style={ui.card}>
              <Text style={ui.body}>
                {confirm === "delete"
                  ? "Delete this saved chat from the current browser session?"
                  : "Export the conversation shown above as a readable text file? The exported copy will no longer be protected by MindVault."}
              </Text>
              <Button
                title={
                  confirm === "delete" ? "Delete saved chat" : "Confirm export"
                }
                onPress={() => {
                  if (confirm === "export") {
                    p.onExport(conversation);
                    setConfirm(undefined);
                    return;
                  }
                  p.onDelete(conversation.id);
                  setSelected(undefined);
                  setConfirm(undefined);
                  setNotice("Saved chat deleted.");
                }}
              />
              <Button
                title="Cancel"
                secondary
                onPress={() => setConfirm(undefined)}
              />
            </View>
          ) : (
            <View style={ui.row}>
              <Button
                title="Export"
                secondary
                onPress={() => setConfirm("export")}
              />
              <Button
                title="Delete"
                secondary
                onPress={() => setConfirm("delete")}
              />
            </View>
          )}
        </>
      ) : p.conversations.length ? (
        p.conversations.map((item) => (
          <Button
            key={item.id}
            title={`${item.title} · ${new Date(item.updatedAt).toLocaleDateString()}`}
            secondary
            onPress={() => setSelected(item.id)}
          />
        ))
      ) : (
        <View style={ui.card}>
          <Text style={ui.cardTitle}>Nothing saved yet</Text>
          <Text style={ui.body}>
            Open Companion and press Save this chat when you want to keep a
            session.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
