import React from "react";
import { ScrollView, Text, View } from "react-native";
import Squirrel from "../../../../src/components/Squirrel";
import { Button } from "../../components/Button";
import { ui } from "../../components/ui.styles";
import { styles as s } from "./HomeScreen.styles";
export function HomeScreen({
  open,
  savedCount,
}: {
  open: (page: string) => void;
  savedCount: number;
}) {
  return (
    <ScrollView contentContainerStyle={ui.content}>
      <View style={s.hero}>
        <Text style={ui.tag}>A PAUSE, JUST FOR YOU</Text>
        <View style={s.mascot}>
          <Squirrel />
        </View>
        <Text style={[ui.title, s.center]}>Welcome to your quiet.</Text>
        <Text style={[ui.body, s.center]}>
          You don’t need the perfect words. Start wherever you are.
        </Text>
      </View>
      <View style={s.entries}>
        <Button
          title="Type · Talk with your companion"
          onPress={() => open("Companion")}
        />
        <Button
          title="Guided check-in · One gentle question"
          secondary
          onPress={() => open("Check-in")}
        />
        <Button
          title="Voice · Preview availability"
          secondary
          onPress={() => open("Voice")}
        />
        <Button
          title={`Saved chats · ${savedCount ? `${savedCount} protected` : "Private history"}`}
          secondary
          onPress={() => open("Saved chats")}
        />
      </View>
      <Text style={[ui.small, s.center]}>
        Private by choice. Chats are saved only when you choose.{"\n"}
        Experimental self-help for ages 13 and up.
      </Text>
    </ScrollView>
  );
}
