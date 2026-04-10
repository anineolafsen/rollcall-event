import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

export default function PopupUserNeeds() {
  const [allergies, setAllergies] = useState("");
  const [otherInfo, setOtherInfo] = useState("");

const handleSave = async () => {
  try {
    await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/users/profile/needs`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ allergies, otherInfo }),
    });
  } catch (error) {
    console.error("Feil ved lagring:", error);
  }
};

const handleSkip = () => {
  // TODO: naviger videre / lukk visningen
};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Welcome</Text>
          <View style={styles.titleDivider} />

          <FormField
            label="Allergies"
            placeholder="Add allergies"
            value={allergies}
            onChangeText={setAllergies}
            multiline
          />

          <FormField
            label="Other needs or important information"
            placeholder="Add relevant info"
            value={otherInfo}
            onChangeText={setOtherInfo}
            multiline
          />

          <Text style={styles.sectionLabel}>
            This information helps us ensure your safety during trips (e.g.
            allergies or accessibility needs). It is only visible to organizers
            and can be edited or removed at any time.{" "}
          </Text>

          <View style={styles.buttonRow}>
            <View style={{ flex: 1 }}>
              <AppButton
                label="Skip"
                variant="secondary"
                onPress={handleSkip}
              />
            </View>

            <View style={{ flex: 1 }}>
              <AppButton label="Save" onPress={handleSave} />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4f1ec",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    backgroundColor: "#eef5fb",
    paddingHorizontal: 22,
    paddingTop: 80,
    paddingBottom: 80,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    textAlign: "center",
    color: "#090909",
  },
  titleDivider: {
    height: 3,
    backgroundColor: "#76b6ee",
    borderRadius: 999,
    marginTop: 14,
    marginBottom: 28,
    marginHorizontal: 28,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: "500",
    color: "#111111",
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
});
