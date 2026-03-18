import { View, StyleSheet, Alert, Platform } from "react-native";
import { useState } from "react";
import { useSignUp, useAuth } from "@clerk/clerk-expo";
import { useRouter, Redirect } from "expo-router";

import AuthInput from "@/components/AuthInput";
import AuthButton from "@/components/AuthButton";
import ThemedText from "@/components/ThemedText";

export default function SignUpPage() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const router = useRouter();

  // form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // verification state
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already signed in
  if (authLoaded && isSignedIn) {
    return <Redirect href="/" />;
  }

  const onSignUpPress = async () => {
    if (!isLoaded || loading) return;

    try {
      setLoading(true);
      setError("");
      console.log("Starting sign up...");

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timed out after 10s")), 10000)
      );

      const result = await Promise.race([
        signUp.create({ emailAddress: email.trim(), password }),
        timeoutPromise,
      ]);

      console.log("signUp.create success:", result);

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      console.log("prepareEmailAddressVerification success");

      setPendingVerification(true);
    } catch (err: any) {
      console.log("Sign up error:", JSON.stringify(err, null, 2));

      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Something went wrong during sign up.";

      setError(message);
      Alert.alert("Sign Up Failed", message);
    } finally {
      console.log("Ending sign up request");
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      setLoading(true);
      setError("");

      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
      } else {
        console.log(
          "Sign up not complete:",
          JSON.stringify(completeSignUp, null, 2)
        );

        const message = "Verification was not completed. Please try again.";
        setError(message);
        Alert.alert("Verification Failed", message);
      }
    } catch (err: any) {
      console.log("Verification error:", JSON.stringify(err, null, 2));

      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Invalid or expired verification code.";

      setError(message);
      Alert.alert("Verification Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View id="clerk-captcha" />
      <ThemedText style={styles.title}>
        {pendingVerification ? "Verify your email" : "Create Account"}
      </ThemedText>

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

      {!pendingVerification ? (
        <>
          <AuthInput
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            id="email"
            name="email"
          />

          <AuthInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            id="password"
            name="password"
          />

          <AuthButton
            title={loading ? "Signing Up..." : "Sign Up"}
            onPress={onSignUpPress}
          />
        </>
      ) : (
        <>
          <ThemedText style={styles.subtitle}>
            We sent a verification code to {email}
          </ThemedText>

          <AuthInput
            placeholder="Verification code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            id="code"
            name="code"
          />

          <AuthButton
            title={loading ? "Verifying..." : "Verify Email"}
            onPress={onVerifyPress}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  error: {
    color: "red",
    marginBottom: 12,
  },
});