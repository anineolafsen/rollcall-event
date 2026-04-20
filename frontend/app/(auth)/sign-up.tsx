import { View, StyleSheet, Alert } from "react-native";
import { useState } from "react";
import { useSignUp, useAuth } from "@clerk/expo";
import { useRouter, Redirect } from "expo-router";

import AuthInput from "@/components/AuthInput";
import AuthButton from "@/components/AuthButton";
import ThemedText from "@/components/ThemedText";

export default function SignUpPage() {
  const { signUp } = useSignUp();
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

  const getErrorMessage = (err: any, fallback: string) =>
    err?.errors?.[0]?.longMessage ||
    err?.errors?.[0]?.message ||
    err?.message ||
    fallback;

  // Redirect if already signed in
  if (authLoaded && isSignedIn) {
    return <Redirect href="/" />;
  }

  const onSignUpPress = async () => {
    if (!signUp || loading) return;

    try {
      setLoading(true);
      setError("");
      console.log("Starting sign up...");

      await signUp.create({
        emailAddress: email.trim(),
      });

      await signUp.password({
        password,
      });

      console.log("signUp.create and password success");

      await signUp.verifications.sendEmailCode();

      console.log("sendEmailCode success");

      setPendingVerification(true);
    } catch (err: any) {
      console.log("Sign up error:", JSON.stringify(err, null, 2));

      const message = getErrorMessage(
        err,
        "Something went wrong during sign up."
      );

      setError(message);
      Alert.alert("Sign Up Failed", message);
    } finally {
      console.log("Ending sign up request");
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!signUp) return;

    try {
      setLoading(true);
      setError("");

      await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      });

      if (signUp.status === "complete") {
        await signUp.finalize();

        // This is for fetching Clerk user info after signing up
        try {
          await fetch("http://localhost:5118/api/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email.trim(),
              clerkId: signUp.createdUserId,
            }),
          });
        } catch (e) {
          console.log("Failed to sync user to backend", e);
        }

        router.replace("/");
      } else {
        console.log(
          "Sign up not complete:",
          JSON.stringify(signUp, null, 2)
        );

        const message = "Verification was not completed. Please try again.";
        setError(message);
        Alert.alert("Verification Failed", message);
      }
    } catch (err: any) {
      console.log("Verification error:", JSON.stringify(err, null, 2));

      const message = getErrorMessage(
        err,
        "Invalid or expired verification code."
      );

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
          />

          <AuthInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
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
