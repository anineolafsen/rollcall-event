// app/(app)/(tabs)/profile.tsx

import { useState, useEffect } from "react";
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

export default function ProfileScreen() {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [allergies, setAllergies] = useState("");
  const [otherInfo, setOtherInfo] = useState("");

  useEffect(() => {
    const fetchUserNeeds = async () => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/users/profile/needs`
        );
        const data = await response.json();
        setAllergies(data.allergies ?? "");
        setOtherInfo(data.otherInfo ?? "");
      } catch (error) {
        console.error("Feil ved henting av data:", error);
      }
    };

    fetchUserNeeds();
  }, []);

  const handleEditProfile = async () => {
    try {
      // TODO: legg til endepunkt for å oppdatere name og phoneNumber
      await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/users/profile/needs`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ allergies, otherInfo }),
      });
    } catch (error) {
      console.error("Feil ved oppdatering:", error);
    }
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
          <Text style={styles.title}>My Profile</Text>
          <View style={styles.titleDivider} />

          <FormField
            label="Name"
            placeholder="Add name"
            value={name}
            onChangeText={setName}
          />

          <FormField
            label="Phone number"
            placeholder="Add phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="number-pad"
          />

          <FormField
            label="Allergies"
            placeholder="Add allergies"
            value={allergies}
            onChangeText={setAllergies}
          />

          <FormField
            label="Other needs or important information"
            placeholder="Add relevant info"
            value={otherInfo}
            onChangeText={setOtherInfo}
          />

          <AppButton label="Edit profile" onPress={handleEditProfile} />
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
});