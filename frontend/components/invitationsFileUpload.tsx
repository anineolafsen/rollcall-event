import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { read, utils } from "xlsx";

export type EmailEntry = {
  email: string;
  valid: boolean;
  row: number;
};

export type UploadState =
  | "idle"
  | "picking"
  | "parsing"
  | "validating"
  | "ready"
  | "submitting"
  | "success"
  | "error";

export type EmailInviteUploaderProps = {
  tripId: number;
  apiUrl?: string;
  onSubmit?: (validEmails: string[]) => Promise<void>;
  onStateChange?: (state: UploadState) => void;
  maxEmails?: number;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return EMAIL_REGEX.test(value.trim());
}

async function readXlsxToRows(uri: string): Promise<string[][]> {
  try {
    // File reading for web
    if (Platform.OS === "web") {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const workbook = read(arrayBuffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: string[][] = utils.sheet_to_json(firstSheet, {
        header: 1,
        defval: "",
      });
      return rows;
    } else {
      // FileSystem API for native
      const FileSystem = await import("expo-file-system");
      const fileContent = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });
      const arrayBuffer = Buffer.from(fileContent, "base64");
      const workbook = read(arrayBuffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: string[][] = utils.sheet_to_json(firstSheet, {
        header: 1,
        defval: "",
      });
      return rows;
    }
  } catch {
    throw new Error(
      "Could not read the file. Make sure it is a valid Excel or CSV file.",
    );
  }
}

export default function EmailInviteUploader({
  tripId,
  apiUrl = process.env.EXPO_PUBLIC_API_URL
    ? `${process.env.EXPO_PUBLIC_API_URL}/api`
    : "http://localhost:5118/api",
  onSubmit,
  onStateChange,
  maxEmails = 500,
}: EmailInviteUploaderProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [entries, setEntries] = useState<EmailEntry[]>([]);
  const [submittedEmails, setSubmittedEmails] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualEmail, setManualEmail] = useState<string>("");

  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  const validEntries = entries.filter((e) => e.valid);
  const invalidEntries = entries.filter((e) => !e.valid);

  const handlePickFile = useCallback(async () => {
    try {
      setState("picking");
      setErrorMessage(null);
      setFileName(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/csv",
          "text/comma-separated-values",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setState("idle");
        return;
      }

      const asset = result.assets[0];
      setState("parsing");
      setFileName(asset.name);

      let rows: string[][];
      try {
        rows = await readXlsxToRows(asset.uri);
      } catch {
        throw new Error(
          "Could not read the file. Make sure it is a valid .xlsx or .xls spreadsheet.",
        );
      }

      setState("validating");

      const rawEmails = rows
        .map((row, i) => ({ raw: row[0], row: i + 1 }))
        .filter(({ raw }) => String(raw ?? "").trim() !== "");

      if (rawEmails.length === 0) {
        throw new Error(
          "The first column appears to be empty. Make sure your email addresses are in column A.",
        );
      }

      if (rawEmails.length > maxEmails) {
        throw new Error(
          `This file contains ${rawEmails.length} entries, which exceeds the ${maxEmails}-email limit. Please split the list and upload in batches.`,
        );
      }

      const parsed: EmailEntry[] = rawEmails.map(({ raw, row }) => ({
        email: String(raw).trim(),
        valid: validateEmail(raw),
        row,
      }));

      setEntries((prev) => {
        const existingEmails = new Set(prev.map((e) => e.email.toLowerCase()));
        const newEntries = parsed.filter(
          (p) => !existingEmails.has(p.email.toLowerCase()),
        );
        const merged = [...prev, ...newEntries];
        return merged.map((e, idx) => ({ ...e, row: idx + 1 }));
      });
      setState("ready");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(message);
      setState("error");
    }
  }, [maxEmails]);

  const submitEmails = useCallback(async () => {
    try {
      setState("submitting");
      const emails = validEntries.map((e) => e.email);

      if (onSubmit) {
        await onSubmit(emails);
      } else {
        const invitations = emails.map((email) => ({
          tripID: tripId,
          userEmail: email,
        }));

        for (const invitation of invitations) {
          const response = await fetch(`${apiUrl}/invitations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(invitation),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error: ${response.status} - ${errorText}`);
            throw new Error(
              `Failed to add invitation for ${invitation.userEmail}. Server returned: ${response.status}`,
            );
          }
        }
      }

      setSubmittedEmails(emails);
      setState("success");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send invitations.";
      setErrorMessage(message);
      setState("error");
    }
  }, [validEntries, onSubmit, tripId, apiUrl]);

  const handleSubmit = useCallback(async () => {
    if (validEntries.length === 0) return;

    if (invalidEntries.length > 0) {
      Alert.alert(
        "Invalid emails detected",
        `${invalidEntries.length} row(s) have invalid email addresses and will be skipped. Continue with ${validEntries.length} valid email(s)?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Continue", onPress: () => submitEmails() },
        ]
      );
    } else {
      submitEmails();
    }
  }, [validEntries, invalidEntries, submitEmails]);

  const handleReset = () => {
    setState("idle");
    setFileName(null);
    setEntries([]);
    setSubmittedEmails([]);
    setErrorMessage(null);
    setManualEmail("");
  };

  const handleAddManualEmail = () => {
    const trimmedEmail = manualEmail.trim();
    if (!trimmedEmail) {
      Alert.alert("Empty email", "Please enter an email address.");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      Alert.alert(
        "Invalid email",
        `"${trimmedEmail}" is not a valid email address.`,
      );
      return;
    }

    if (
      entries.some((e) => e.email.toLowerCase() === trimmedEmail.toLowerCase())
    ) {
      Alert.alert(
        "Duplicate email",
        `"${trimmedEmail}" is already in the list.`,
      );
      return;
    }

    const newEntry: EmailEntry = {
      email: trimmedEmail,
      valid: true,
      row: entries.length + 1,
    };

    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    setManualEmail("");

    if (state === "idle") {
      setState("ready");
    }
  };

  const handleRemoveEntry = (index: number) => {
    const updatedEntries = entries
      .filter((_, i) => i !== index)
      .map((e, idx) => ({ ...e, row: idx + 1 }));
    setEntries(updatedEntries);

    if (updatedEntries.length === 0) {
      setState("idle");
      setFileName(null);
    }
  };

  const isSubmitting = state === "submitting";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Invite by email</Text>
      <Text style={styles.subtitle}>
        Upload an Excel file with email addresses in the first column (column
        A).
      </Text>

      {/* Manual Email Input */}
      {(state === "idle" || state === "error" || state === "ready") && (
        <View style={styles.manualInputSection}>
          <View style={styles.manualInputRow}>
            <TextInput
              style={styles.emailInput}
              placeholder="Or type an email address"
              placeholderTextColor="#9CA3AF"
              value={manualEmail}
              onChangeText={setManualEmail}
              keyboardType="email-address"
              editable={!isSubmitting}
            />
            <TouchableOpacity
              style={[
                styles.addButton,
                !manualEmail.trim() && styles.addButtonDisabled,
              ]}
              onPress={handleAddManualEmail}
              disabled={!manualEmail.trim() || isSubmitting}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Upload button*/}
      {(state === "idle" || state === "error" || state === "ready") && (
        <>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handlePickFile}
          >
            <Text style={styles.uploadButtonText}>Select spreadsheet</Text>
          </TouchableOpacity>
          {state === "error" && errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}
        </>
      )}

      {/* Loading states*/}
      {(state === "picking" ||
        state === "parsing" ||
        state === "validating" ||
        state === "submitting") && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>
            {state === "picking"
              ? "Opening file picker…"
              : state === "parsing"
                ? "Reading spreadsheet…"
                : state === "validating"
                  ? "Validating emails…"
                  : "Sending invitations…"}
          </Text>
        </View>
      )}

      {(state === "ready" || state === "submitting") && entries.length > 0 && (
        <View style={styles.resultsContainer}>
          {fileName && (
            <Text style={styles.fileName} numberOfLines={1}>
              {fileName}
            </Text>
          )}
          <View style={styles.pillRow}>
            <View style={[styles.pill, styles.pillValid]}>
              <Text style={[styles.pillText, styles.pillValidText]}>
                {validEntries.length} valid
              </Text>
            </View>
            {invalidEntries.length > 0 && (
              <View style={[styles.pill, styles.pillInvalid]}>
                <Text style={[styles.pillText, styles.pillInvalidText]}>
                  {invalidEntries.length} invalid
                </Text>
              </View>
            )}
          </View>

          {/* Email list */}
          <ScrollView style={styles.listScroll} nestedScrollEnabled>
            {entries.map((item, index) => (
              <View
                key={`${item.row}-${item.email}`}
                style={[styles.listItem, !item.valid && styles.listItemInvalid]}
              >
                <Text
                  style={[
                    styles.listItemEmail,
                    !item.valid && styles.listItemEmailInvalid,
                  ]}
                  numberOfLines={1}
                >
                  {item.email}
                </Text>
                <Text style={styles.listItemRow}>row {item.row}</Text>
                {!item.valid && (
                  <Text style={styles.listItemBadge}>invalid</Text>
                )}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveEntry(index)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleReset}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                validEntries.length === 0 && styles.primaryButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={validEntries.length === 0 || state === "submitting"}
            >
              <Text style={styles.primaryButtonText}>
                Send {validEntries.length} invitation
                {validEntries.length !== 1 ? "s" : ""}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {state === "success" && (
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Invitations sent!</Text>
          <Text style={styles.successSubtitle}>
            {validEntries.length} email invitation
            {validEntries.length !== 1 ? "s were" : " was"} queued successfully.
          </Text>

          {/* Display submitted emails */}
          {submittedEmails.length > 0 && (
            <>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color: "#111827",
                  marginTop: 10,
                  marginBottom: 6,
                }}
              >
                Invited addresses:
              </Text>
              <ScrollView
                style={[
                  styles.listScroll,
                  { maxHeight: 120, marginBottom: 12 },
                ]}
                nestedScrollEnabled
              >
                {submittedEmails.map((email, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <Text style={styles.listItemEmail} numberOfLines={1}>
                      {email}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          <TouchableOpacity style={styles.uploadButton} onPress={handleReset}>
            <Text style={styles.uploadButtonText}>Add more emails</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
    lineHeight: 18,
  },
  manualInputSection: {
    marginBottom: 12,
  },
  manualInputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  emailInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },
  addButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#A5B4FC",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  uploadButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#6B7280",
  },
  errorBanner: {
    marginTop: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 6,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444",
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 12,
    lineHeight: 16,
  },
  resultsContainer: {
    gap: 10,
    marginTop: 12,
  },
  fileName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
  },
  pill: {
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  pillValid: {
    backgroundColor: "#D1FAE5",
  },
  pillValidText: {
    color: "#065F46",
  },
  pillInvalid: {
    backgroundColor: "#FEE2E2",
  },
  pillInvalidText: {
    color: "#991B1B",
  },
  listScroll: {
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    maxHeight: 150,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F3F4F6",
    gap: 6,
  },
  listItemInvalid: {
    backgroundColor: "#FFF7F7",
  },
  listItemEmail: {
    flex: 1,
    fontSize: 12,
    color: "#111827",
  },
  listItemEmailInvalid: {
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  listItemRow: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  listItemBadge: {
    fontSize: 10,
    fontWeight: "600",
    color: "#DC2626",
    backgroundColor: "#FEE2E2",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeButtonText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#4F46E5",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: "#A5B4FC",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingHorizontal: 14,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  secondaryButtonText: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "500",
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 10,
  },
  successIcon: {
    fontSize: 32,
    color: "#059669",
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  successSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 4,
  },
});
