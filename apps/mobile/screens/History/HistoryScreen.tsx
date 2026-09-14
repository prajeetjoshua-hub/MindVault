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
  onCreatePassword: (password: string) => Promise<boolean>;
  onVerifyPassword: (password: string) => Promise<boolean>;
  onSavePending: () => Promise<boolean>;
  onDelete: (id: string) => void;
  onExport: (conversation: Conversation) => void;
};

export function HistoryScreen(p: Props) {
  const [unlocked, setUnlocked] = useState(false),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [selected, setSelected] = useState<string>(),
    [confirm, setConfirm] = useState<"delete" | "export">(),
    [deletePassword, setDeletePassword] = useState(""),
    [notice, setNotice] = useState(""),
    [working, setWorking] = useState(false);
  const conversation = p.conversations.find((item) => item.id === selected);

  const unlock = async () => {
    if (working) return;
    if (!p.lock && password !== confirmation) {
      setNotice("The two passwords do not match.");
      return;
    }
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
      setUnlocked(true);
      setPassword("");
      setConfirmation("");
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

  if (!unlocked) {
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
            ? "Enter your MindVault password to view, save, export or delete a conversation."
            : "Create a MindVault password before saving your first conversation. The password itself is never stored."}
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
            p.lock ? "Saved chats password" : "Create saved chats password"
          }
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={
            p.lock ? "Enter password" : "Create password · 6+ characters"
          }
          placeholderTextColor={colors.muted}
          style={ui.input}
        />
        {!p.lock && (
          <TextInput
            accessibilityLabel="Confirm saved chats password"
            value={confirmation}
            onChangeText={setConfirmation}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Confirm password"
            placeholderTextColor={colors.muted}
            style={ui.input}
          />
        )}
        {!!notice && <Text style={ui.error}>{notice}</Text>}
        <Button
          title={
            working
              ? "Checking…"
              : p.pendingConversation
                ? p.lock
                  ? "Unlock & save chat"
                  : "Create password & save chat"
                : p.lock
                  ? "Unlock saved chats"
                  : "Create password"
          }
          disabled={!password || (!p.lock && !confirmation) || working}
          onPress={() => void unlock()}
        />
        <Text style={ui.small}>
          {p.persistent
            ? "Saved conversations remain inside the encrypted device vault. Device unlock still protects the whole app."
            : "Desktop preview: saved chats last only for this browser session. This password demonstrates in-app access control; close or reload the preview to clear its memory."}
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
        Conversations are saved only when you press Save this chat. Leaving this
        screen locks the list again.
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
              setDeletePassword("");
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
                  ? "Enter your MindVault password again to delete this saved chat."
                  : "Export the conversation shown above as a readable text file? The exported copy will no longer be protected by MindVault."}
              </Text>
              {confirm === "delete" && (
                <TextInput
                  accessibilityLabel="Password to delete saved chat"
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Enter password"
                  placeholderTextColor={colors.muted}
                  style={ui.input}
                />
              )}
              <Button
                title={
                  confirm === "delete" ? "Verify & delete" : "Confirm export"
                }
                disabled={confirm === "delete" && !deletePassword}
                onPress={() => {
                  if (confirm === "export") {
                    p.onExport(conversation);
                    setConfirm(undefined);
                    return;
                  }
                  void p.onVerifyPassword(deletePassword).then((accepted) => {
                    if (!accepted) {
                      setNotice(
                        "That password is incorrect. The chat was not deleted.",
                      );
                      return;
                    }
                    p.onDelete(conversation.id);
                    setSelected(undefined);
                    setConfirm(undefined);
                    setDeletePassword("");
                    setNotice("Saved chat deleted.");
                  });
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
