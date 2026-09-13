import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Button } from "../../components/Button";
import { ui } from "../../components/ui.styles";
import type { Preferences } from "../../../../packages/contracts/types";
export function CheckInScreen({
  onComplete,
}: {
  onComplete: (text: string, goal?: Preferences["goal"]) => void;
}) {
  const [mood, setMood] = useState("");
  return (
    <ScrollView contentContainerStyle={ui.content}>
      <Text style={ui.tag}>A MOMENT FOR YOU</Text>
      <Text style={ui.title}>
        {mood ? "What would help today?" : "How are things feeling?"}
      </Text>
      <Text style={ui.body}>
        No score to achieve. Choose what feels closest, or go straight to your
        companion.
      </Text>
      {!mood ? (
        ["Okay", "A little worried", "Overwhelmed", "Low", "Not sure"].map(
          (value) => (
            <Button
              key={value}
              title={value}
              secondary
              onPress={() => setMood(value)}
            />
          ),
        )
      ) : (
        <View style={ui.card}>
          {[
            "I want to talk about it",
            "Help me find a small next step",
            "I just want someone to listen",
          ].map((goal, index) => (
            <Button
              key={goal}
              title={goal}
              secondary
              onPress={() => {
                onComplete(
                  `I feel ${mood.toLowerCase()}. ${goal}.`,
                  (["reflect", "plan", "listen"] as const)[index],
                );
                setMood("");
              }}
            />
          ))}
        </View>
      )}
      <Button
        title={mood ? "Change my answer" : "Skip check-in"}
        secondary
        onPress={() => (mood ? setMood("") : onComplete(""))}
      />
    </ScrollView>
  );
}
