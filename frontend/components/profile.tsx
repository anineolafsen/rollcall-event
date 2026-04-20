import { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

type TripNeeds = {
  tripId: number;
  tripName: string;
  allergies: string | null;
  otherInfo: string | null;
};

export default function ProfileScreen() {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tripNeeds, setTripNeeds] = useState<TripNeeds[]>([]);
  const [editingTripId, setEditingTripId] = useState<number | null>(null);
  const [draftAllergies, setDraftAllergies] = useState("");
  const [draftOtherInfo, setDraftOtherInfo] = useState("");

  const router = useRouter();

  //TODO: bytt ut med ekte userId når session/token er implementert
  const userId = 7;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, needsRes] = await Promise.all([
          fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/users`),
          fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/users/${userId}/needs`),
        ]);
        const users = await userRes.json();
        const currentUser = users.find((u: { id: number }) => u.id === userId);
        if (currentUser) {
          setName(currentUser.name ?? "");
          setPhoneNumber(currentUser.phone ?? "");
        }
        const needs = await needsRes.json();
        setTripNeeds(needs);
      } catch (error) {
        console.error("Feil ved henting av data:", error);
      }
    };

    fetchData();
  }, []);

  const handleEditProfile = async () => {
    if (!isEditingProfile) {
      setIsEditingProfile(true);
      return;
    }
    try {
      await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/users/${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone: phoneNumber }),
        }
      );
    } catch (error) {
      console.error("Feil ved oppdatering:", error);
    }
    setIsEditingProfile(false);
  };

  const startEditing = (item: TripNeeds) => {
    setEditingTripId(item.tripId);
    setDraftAllergies(item.allergies ?? "");
    setDraftOtherInfo(item.otherInfo ?? "");
  };

  const cancelEditing = () => {
    setEditingTripId(null);
  };

  const saveNeeds = async (tripId: number) => {
    try {
      await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/users/${userId}/needs/${tripId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            allergies: draftAllergies,
            otherInfo: draftOtherInfo,
          }),
        }
      );
      setTripNeeds((prev) =>
        prev.map((item) =>
          item.tripId === tripId
            ? { ...item, allergies: draftAllergies, otherInfo: draftOtherInfo }
            : item
        )
      );
    } catch (error) {
      console.error("Feil ved lagring:", error);
    }
    setEditingTripId(null);
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
            editable={isEditingProfile}
          />

          <FormField
            label="Phone number"
            placeholder="Add phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="number-pad"
            editable={isEditingProfile}
          />

          <AppButton
            label={isEditingProfile ? "Save" : "Edit profile"}
            onPress={handleEditProfile}
          />

          {tripNeeds.length > 0 && (
            <>
              <View style={styles.sectionDivider} />

              <Text style={styles.sectionTitle}>Personal information</Text>

              {tripNeeds.map((item) =>
                editingTripId === item.tripId ? (
                  <View key={item.tripId} style={styles.tripCard}>
                    <Text style={styles.tripName}>{item.tripName}</Text>

                    <FormField
                      label="Allergies"
                      placeholder="Add allergies"
                      value={draftAllergies}
                      onChangeText={setDraftAllergies}
                      multiline
                    />
                    <FormField
                      label="Other needs or important information"
                      placeholder="Add relevant info"
                      value={draftOtherInfo}
                      onChangeText={setDraftOtherInfo}
                      multiline
                    />
                    <View style={styles.editButtonRow}>
                      <View style={{ flex: 1 }}>
                        <AppButton
                          label="Cancel"
                          variant="secondary"
                          onPress={cancelEditing}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppButton
                          label="Save"
                          onPress={() => saveNeeds(item.tripId)}
                        />
                      </View>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    key={item.tripId}
                    style={styles.tripCard}
                    onPress={() => router.push(`/trips/${item.tripId}`)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardRow}>
                      <View style={styles.cardInfo}>
                        <Text style={styles.tripName}>{item.tripName}</Text>

                        {item.allergies ? (
                          <Text style={styles.needsLabel}>
                            Allergies:{" "}
                            <Text style={styles.needsValue}>
                              {item.allergies}
                            </Text>
                          </Text>
                        ) : null}

                        {item.otherInfo ? (
                          <Text style={styles.needsLabel}>
                            Other info:{" "}
                            <Text style={styles.needsValue}>
                              {item.otherInfo}
                            </Text>
                          </Text>
                        ) : null}

                        {!item.allergies && !item.otherInfo ? (
                          <Text style={styles.noNeedsText}>
                            No allergies or other needs has been added
                          </Text>
                        ) : null}

                        <Text style={styles.deleteNote}>
                          This information will be deleted when the trip is
                          finished.
                        </Text>
                      </View>

                      <View style={styles.cardEditButton}>
                        <AppButton
                          label="Edit"
                          onPress={() => startEditing(item)}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              )}
            </>
          )}
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
  sectionDivider: {
    height: 1,
    backgroundColor: "#cccccc",
    borderRadius: 999,
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#090909",
    marginBottom: 12,
  },
  tripCard: {
    backgroundColor: "#ddeaf7",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  tripName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#090909",
    marginBottom: 6,
  },
  needsLabel: {
    fontSize: 14,
    color: "#333333",
    marginBottom: 4,
  },
  needsValue: {
    fontWeight: "400",
    color: "#111111",
  },
  deleteNote: {
    fontSize: 12,
    color: "#777777",
    marginTop: 8,
    fontStyle: "italic",
  },
  noNeedsText: {
    fontSize: 14,
    color: "#777777",
    fontStyle: "italic",
    marginBottom: 4,
  },
  editButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardEditButton: {
    alignSelf: "center",
  },
});
