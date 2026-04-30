import { useEffect, useRef, useState, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/button";
import { DateField, formatDateValue, parseDateValue } from '@/components/ui/date-field';
import { FormField } from "@/components/ui/form-field";

type FormValues = {
  title: string;
  destination: string;
  dateFrom: string;
  dateTo: string;
  description: string;
};

type FormErrors = Partial<Record<'title' | 'destination' | 'dateFrom' | 'dateTo' | 'description', string>>;
type DateFieldName = 'dateFrom' | 'dateTo';

const parseDate = (dateStr: string): Date | null => {
  const trimmed = dateStr.trim();
  const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (date.getDate() === parseInt(day)) {
      return date;
    }
    return null;
  }

  // Try ISO format (YYYY-MM-DD)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (date.getDate() === parseInt(day)) {
      return date;
    }
    return null;
  }

  return null;
};

const formatDateToISO = (dateStr: string): string | null => {
  const date = parseDate(dateStr);
  if (!date) return null;
  return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
};

const initialFormValues: FormValues = {
  title: "",
  destination: "",
  dateFrom: "",
  dateTo: "",
  description: "",
};

export function CreateTripScreen() {
  const { id: tripId } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const isEditing = Boolean(tripId);
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);
  const { width } = useWindowDimensions();

  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [activeDateField, setActiveDateField] = useState<DateFieldName | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTrip, setIsLoadingTrip] = useState(false);
  const showDesktopBackButton = Platform.OS === 'web' && width >= 900;
  const isMobileLayout = !showDesktopBackButton;
  const minimumStartValue = formatDateValue(new Date());
  const loadedTripIdRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) return;
      if (loadedTripIdRef.current === tripId) return;

      loadedTripIdRef.current = tripId;
      setIsLoadingTrip(true);
      try {
        const token = await getToken({ template: 'RollCallAuth' });
        const apiUrl = process.env.EXPO_PUBLIC_API_URL
          ? `${process.env.EXPO_PUBLIC_API_URL}/api`
          : "http://localhost:5118/api";
        const token = await getTokenRef.current({ template: "RollCallAuth" });
        const response = await fetch(`${apiUrl}/trips/${tripId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to load trip");
        const data = await response.json();
        const formatISOToDisplay = (isoDate: string): string => {
          const date = new Date(isoDate);
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const year = date.getFullYear();
          return `${day}.${month}.${year}`;
        };
        setFormValues({
          title: data.name || "",
          destination: data.destination || "",
          dateFrom: data.startDate ? formatISOToDisplay(data.startDate) : "",
          dateTo: data.endDate ? formatISOToDisplay(data.endDate) : "",
          description: data.description || "",
        });
      } catch (error) {
        loadedTripIdRef.current = null;
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load trip";
        Alert.alert("Error", errorMessage);
        router.back();
      } finally {
        setIsLoadingTrip(false);
      }
    };
    void fetchTrip();
  }, [getToken, tripId, router]);

  const updateField = <K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));

    setSuccessMessage("");
  };

  const getDateErrors = (values: Pick<FormValues, 'dateFrom' | 'dateTo'>) => {
    const nextErrors: Pick<FormErrors, 'dateFrom' | 'dateTo'> = {};
    const now = new Date();

    if (values.dateFrom) {
      const startDate = parseDateValue(values.dateFrom);
      if (startDate < now) {
        nextErrors.dateFrom = 'Start date cannot be in the past.';
      }
    }

    if (values.dateFrom && values.dateTo) {
      const startDate = parseDateValue(values.dateFrom);
      const endDate = parseDateValue(values.dateTo);
      if (endDate <= startDate) {
        nextErrors.dateTo = 'End date must be after start date.';
      }
    }

    return nextErrors;
  };

  const updateDateField = (field: DateFieldName, value: string) => {
    setFormValues((currentValues) => {
      const nextValues = {
        ...currentValues,
        [field]: value,
      };

      if (
        field === 'dateFrom' &&
        nextValues.dateTo &&
        parseDateValue(nextValues.dateTo) <= parseDateValue(value)
      ) {
        nextValues.dateTo = '';
      }

      return nextValues;
    });

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      dateFrom: undefined,
      dateTo: undefined,
      ...getDateErrors({
        dateFrom: field === 'dateFrom' ? value : formValues.dateFrom,
        dateTo:
          field === 'dateTo'
            ? value
            : field === 'dateFrom' && formValues.dateTo && parseDateValue(formValues.dateTo) <= parseDateValue(value)
              ? ''
              : formValues.dateTo,
      }),
    }));

    setSuccessMessage("");
  };

  const toggleDatePicker = (field: DateFieldName) => {
    setActiveDateField((currentField) => (currentField === field ? null : field));
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!formValues.title.trim()) {
      nextErrors.title = "Add a trip name.";
    }

    if (!formValues.destination.trim()) {
      nextErrors.destination = "Add a destination.";
    }

    if (!formValues.dateFrom.trim()) {
      nextErrors.dateFrom = "Add a start date.";
    } else {
      const startDate = parseDate(formValues.dateFrom);
      if (!startDate) {
        nextErrors.dateFrom =
          "Invalid date format. Use DD.MM.YYYY (e.g., 15.05.2026).";
      }
    }

    if (!formValues.dateTo.trim()) {
      nextErrors.dateTo = "Add an end date.";
    } else {
      const endDate = parseDate(formValues.dateTo);
      if (!endDate) {
        nextErrors.dateTo =
          "Invalid date format. Use DD.MM.YYYY (e.g., 15.05.2026).";
      }
    }

    if (!nextErrors.dateFrom && !nextErrors.dateTo) {
      const startDate = parseDate(formValues.dateFrom)!;
      const endDate = parseDate(formValues.dateTo)!;
      if (endDate <= startDate) {
        nextErrors.dateTo = "End date must be after start date.";
      }
    }

    if (!formValues.description.trim()) {
      nextErrors.description = "Add a short description.";
    }

    setFormErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const startDateISO = formatDateToISO(formValues.dateFrom);
      const endDateISO = formatDateToISO(formValues.dateTo);

      if (!startDateISO || !endDateISO) {
        throw new Error("Failed to parse dates");
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL
      const apiUrl = process.env.EXPO_PUBLIC_API_URL
        ? `${process.env.EXPO_PUBLIC_API_URL}/api`
        : "http://localhost:5118/api";

      const tripData = {
        name: formValues.title,
        startDate: startDateISO,
        endDate: endDateISO,
        destination: formValues.destination,
        description: formValues.description,
      };

      if (isEditing && tripId) {
        const token = await getToken({ template: 'RollCallAuth' });
        const response = await fetch(`${apiUrl}/trips/${tripId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(tripData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status} - ${errorText}`,
          );
        }

        setSuccessMessage("Trip updated successfully!");
        Alert.alert("Success", "Trip updated successfully!");
        router.replace(`/trips/${tripId}`);
      } else {
        const token = await getTokenRef.current({ template: "RollCallAuth" });

        // Create new trip
        const response = await fetch(`${apiUrl}/trips`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(tripData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status} - ${errorText}`,
          );
        }

        const result = await response.json();
        console.log("Trip creation response:", result);
        setSuccessMessage("Trip created successfully!");
        const newTripId = result.id || result.tripID || result.tripId || 1;
        console.log("Extracted tripId:", newTripId);
        router.push({
          pathname: "/invite",
          params: {
            id: newTripId,
            tripName: formValues.title,
          },
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : isEditing
            ? "Failed to update trip"
            : "Failed to create trip";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isMobileLayout && styles.mobileScrollContent,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Trip Creation Form */}
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Go back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            {isEditing ? "Edit Trip" : "Create New Trip"}
          </Text>
          <View style={styles.titleDivider} />
          {isLoadingTrip ? (
            <Text style={styles.helperText}>Loading trip details...</Text>
          ) : null}

          <FormField
            label="Trip Name"
            placeholder="Add trip name"
            value={formValues.title}
            onChangeText={(value) => updateField("title", value)}
            error={formErrors.title}
          />

          <FormField
            label="Destination"
            placeholder="Add destination"
            value={formValues.destination}
            onChangeText={(value) => updateField("destination", value)}
            error={formErrors.destination}
          />

          <View style={styles.row}>
            <View style={styles.rowField}>
              <DateField
                label="Date from"
                value={formValues.dateFrom}
                minValue={minimumStartValue}
                onToggle={() => toggleDatePicker('dateFrom')}
                onChange={(value) => updateDateField("dateFrom", value)}
                onClose={() => setActiveDateField(null)}
                isOpen={activeDateField === 'dateFrom'}
                error={formErrors.dateFrom}
              />
            </View>

            <View style={styles.rowField}>
              <DateField
                label="Date to"
                value={formValues.dateTo}
                minValue={formValues.dateFrom || minimumStartValue}
                onToggle={() => toggleDatePicker('dateTo')}
                onChange={(value) => updateDateField("dateTo", value)}
                onClose={() => setActiveDateField(null)}
                isOpen={activeDateField === 'dateTo'}
                error={formErrors.dateTo}
              />
            </View>
          </View>

          <FormField
            label="Description"
            placeholder="Add a short trip description"
            value={formValues.description}
            onChangeText={(value) => updateField("description", value)}
            error={formErrors.description}
            multiline
          />

          {successMessage ? (
            <Text style={styles.successMessage}>{successMessage}</Text>
          ) : null}

          <AppButton
            variant="edit"
            label={
              isLoading
                ? isEditing
                  ? "Saving trip..."
                  : "Creating trip..."
                : isEditing
                  ? "Save changes"
                  : "Create trip"
            }
            onPress={handleSubmit}
            disabled={isLoading || isLoadingTrip}
          />
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
  mobileScrollContent: {
    backgroundColor: '#eef5fb',
  },
  content: {
    backgroundColor: '#eef5fb',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 80,
  },
  mobileContent: {
    paddingHorizontal: 22,
    paddingTop: 64,
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
  backButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 15,
    color: "#4a7ca8",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  successMessage: {
    marginBottom: 16,
    color: "#246b3f",
    fontSize: 14,
    lineHeight: 20,
  },
  helperText: {
    marginBottom: 20,
    fontSize: 13,
    lineHeight: 18,
    color: "#5a7a94",
  },
});
