import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import type { Conversation } from "../../../../packages/contracts/types";
import { Button } from "../../components/Button";
import { ui } from "../../components/ui.styles";
export function HistoryScreen({
  conversations,
  onDelete,
  onExport,
}: {
  conversations: Conversation[];
  onDelete: (id: string) => void;
  onExport: (c: Conversation) => void;
}) {
  const [selected, setSelected] = useState<string>();
  const [confirm, setConfirm] = useState<"delete" | "export">();
  const conversation = conversations.find((c) => c.id === selected);
  return (
    <ScrollView contentContainerStyle={ui.content}>
      <Text style={ui.title}>
        {conversation ? "Your conversation" : "Your journal"}
      </Text>
      <Text style={ui.body}>
        Saved only when you choose to keep history. Exported text is readable
        outside MindVault.
      </Text>
      {conversation ? (
        <>
          <Button
            title="Back to journal"
            secondary
            onPress={() => {
              setSelected(undefined);
              setConfirm(undefined);
            }}
          />
          {conversation.messages.map((m) => (
            <View style={ui.card} key={m.id}>
              <Text style={ui.tag}>{m.role.toUpperCase()}</Text>
              <Text selectable style={ui.body}>
                {m.text}
              </Text>
            </View>
          ))}
          {confirm ? (
            <View style={ui.card}>
              <Text style={ui.body}>
                {confirm === "delete"
                  ? "Delete this conversation and memories derived from it?"
                  : "Export the conversation shown above as a readable text file?"}
              </Text>
              <Button
                title="Confirm"
                onPress={() => {
                  if (confirm === "delete") {
                    onDelete(conversation.id);
                    setSelected(undefined);
                  } else onExport(conversation);
                  setConfirm(undefined);
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
      ) : conversations.length ? (
        conversations.map((c) => (
          <Button
            key={c.id}
            title={`${c.title} · ${new Date(c.updatedAt).toLocaleDateString()}`}
            secondary
            onPress={() => setSelected(c.id)}
          />
        ))
      ) : (
        <View style={ui.card}>
          <Text style={ui.cardTitle}>Nothing saved yet</Text>
          <Text style={ui.body}>
            Turn on conversation history in Settings if you want to keep your
            next conversations.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
