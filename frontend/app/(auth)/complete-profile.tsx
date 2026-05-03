import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import AuthInput from "@/components/AuthInput";
import AuthButton from "@/components/AuthButton";
import ThemedText from "@/components/ThemedText";
import AuthContainer from "@/components/AuthContainer";

export default function CompleteProfileScreen() {
  const { getToken, signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const router = useRouter();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-fill names from Clerk if available
  useEffect(() => {
    if (clerkUser) {
      if (clerkUser.firstName) setFirstName(clerkUser.firstName);
      if (clerkUser.lastName) setLastName(clerkUser.lastName);
    }
  }, [clerkUser]);

  const onSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      
      const response = await fetch("http://localhost:5118/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
        }),
      });

      if (response.ok) {
        router.replace("/");
      } else {
        const errorData = await response.text();
        console.error("Failed to update profile", errorData);
        Alert.alert("Error", "Failed to update profile.");
      }
    } catch (error) {
      console.error("Error submitting profile", error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onSignOut = async () => {
    await signOut();
    router.replace("/sign-in");
  };

  return (
    <AuthContainer>
      <ThemedText style={styles.title}>Complete Your Profile</ThemedText>
      <ThemedText style={styles.subtitle}>
        Please provide your details to continue
      </ThemedText>

      <View style={styles.form}>
        <AuthInput
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />

        <AuthInput
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />

        <AuthInput
          placeholder="Phone Number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <AuthButton
          title={loading ? "Saving..." : "Continue"}
          onPress={onSubmit}
        />
      </View>

      <TouchableOpacity onPress={onSignOut} style={styles.signOutButton}>
        <ThemedText style={styles.signOutText}>Cancel</ThemedText>
      </TouchableOpacity>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.6,
  },
  form: {
    width: "100%",
    gap: 4,
  },
  signOutButton: {
    marginTop: 24,
    alignItems: "center",
  },
  signOutText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "600",
  },
});
