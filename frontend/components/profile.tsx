// app/(app)/(tabs)/profile.tsx

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

export default function ProfileScreen() {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [allergies, setAllergies] = useState("");
  const [otherInfo, setOtherInfo] = useState("");

  const handleEditProfile = () => {
    // TODO: send til backend
    console.log({ name, phoneNumber, allergies, otherInfo });
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