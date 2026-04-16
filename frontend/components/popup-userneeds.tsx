import { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

type Props = {
  tripId?: string;
};

export default function PopupUserNeeds({ tripId }: Props) {
  const router = useRouter();
  const [allergies, setAllergies] = useState("");
  const [otherInfo, setOtherInfo] = useState("");

  // TODO: bytt ut med ekte userId når session/token er implementert
  const userId = 7;

  useEffect(() => {
    if (!tripId) return;

    const fetchExisting = async () => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/users/${userId}/needs/${tripId}`
        );
        const data = await response.json();
        setAllergies(data.allergies ?? "");
        setOtherInfo(data.otherInfo ?? "");
      } catch (error) {
        console.error("Feil ved henting av eksisterende data:", error);
      }
    };

    fetchExisting();
  }, [tripId]);

  const navigateToTrip = () => {
    if (tripId) {
      router.push(`/trips/${tripId}`);
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    try {
      await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/users/${userId}/needs/${tripId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ allergies, otherInfo }),
        }
      );
    } catch (error) {
      console.error("Feil ved lagring:", error);
    }
    // TODO: Naviger til events koblet til denne turen etter lagring.
    navigateToTrip();
  };

  const handleSkip = async () => {
    try {
      await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/users/${userId}/needs/${tripId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ allergies: null, otherInfo: null }),
        }
      );
    } catch (error) {
      console.error("Feil ved lagring av tom UserNeeds:", error);
    }
    // TODO: Naviger til events koblet til denne turen etter skip (ikke navigateToTrip)
    navigateToTrip();
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
            This information helps us ensure your safety during the trip (e.g.
            allergies or accessibility needs). It is only visible to organizers.
            {"\n\n"}
            The information will be deleted when the trip is finished.
            {"\n\n"}
            You can also view this information at any time from your profile
            page.
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
