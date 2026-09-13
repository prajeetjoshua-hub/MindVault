import React, { useState } from "react";
import { Linking, ScrollView, Text, View } from "react-native";
import {
  helplines,
  helplinesVerifiedOn,
} from "../../../../packages/support-content/helplines";
import { Button } from "../../components/Button";
import { ui } from "../../components/ui.styles";
export function HelpScreen() {
  const [selected, setSelected] = useState<(typeof helplines)[number]>(),
    [error, setError] = useState("");
  return (
    <ScrollView contentContainerStyle={ui.content}>
      <Text style={ui.tag}>INDIA · HUMAN SUPPORT</Text>
      <Text style={ui.title}>Reach someone who can help.</Text>
      <Text style={ui.body}>
        If there is immediate danger, use 112. These are India helplines;
        outside India, use your local emergency service.
      </Text>
      {selected ? (
        <View style={ui.card}>
          <Text style={ui.cardTitle}>
            {selected.name} · {selected.number}
          </Text>
          <Text style={ui.body}>
            Open your phone’s dialler for this number. You make the call there.
            MindVault does not send an SOS, location, messages or alerts.
          </Text>
          <Button
            title={`Open dialler · ${selected.number}`}
            onPress={() => {
              void Linking.openURL(`tel:${selected.number}`).catch(() =>
                setError(
                  `A dialler is unavailable here. Call ${selected.number} from a phone.`,
                ),
              );
            }}
          />
          <Button
            title="Choose another helpline"
            secondary
            onPress={() => {
              setSelected(undefined);
              setError("");
            }}
          />
        </View>
      ) : (
        helplines.map((line) => (
          <View style={ui.card} key={line.id}>
            <Text style={ui.cardTitle}>
              {line.name} · {line.number}
            </Text>
            <Text style={ui.body}>{line.description}</Text>
            <Button
              title={
                line.id === "emergency"
                  ? "SOS · Call 112"
                  : `Call ${line.number}`
              }
              secondary={line.id !== "emergency"}
              onPress={() => setSelected(line)}
            />
          </View>
        ))
      )}
      {!!error && (
        <Text accessibilityLiveRegion="polite" style={ui.error}>
          {error}
        </Text>
      )}
      <Text style={ui.small}>
        Numbers are stored in the app and can be read offline. Calls need a
        working telephone connection; turn off airplane mode to try calling.
        Desktop browsers may not have a dialler.
      </Text>
      <Text style={ui.small}>
        Official sources checked {helplinesVerifiedOn}. Availability can change.
        MindVault cannot confirm whether a call connects.
      </Text>
    </ScrollView>
  );
}
