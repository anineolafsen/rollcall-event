import Mountains from '@/components/ui/mountains';
import { View, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { useState } from "react";
import { useSignUp, useAuth } from "@clerk/expo";
import { useRouter, Redirect, Link } from "expo-router";

import AuthInput from "@/components/AuthInput";
import AuthButton from "@/components/AuthButton";
import SocialLoginButtons from "@/components/SocialLoginButtons";
import ThemedText from "@/components/ThemedText";
import AuthContainer from "@/components/AuthContainer";

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
    console.log("[SignUp] Attempting sign up...");
    if (!signUp || loading) return;

    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await signUp.create({
        emailAddress: email.trim(),
      });

      await signUp.password({
        password,
      });

      await signUp.verifications.sendEmailCode();
      
      setPendingVerification(true);
      console.log("[SignUp] Verification email sent.");
    } catch (err: any) {
      console.error("[SignUp] Sign up error:", JSON.stringify(err, null, 2));
      const message = getErrorMessage(err, "Something went wrong during sign up.");
      setError(message);
      Alert.alert("Sign Up Failed", message);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    console.log("[SignUp] Verifying code...");
    if (!signUp) return;

    try {
      setLoading(true);
      setError("");

      await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      });

      if (signUp.status === "complete") {
        await signUp.finalize();
        console.log("[SignUp] Success! Syncing with backend and finalizing session...");
        
        // Manual Sync using new /sync endpoint which calls GetOrCreateUser
        try {
          await fetch("http://localhost:5118/api/users/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email.trim(),
              clerkId: signUp.createdUserId,
              // First Name, Last Name, and Phone are null here at this stage 
            }),
          });
        } catch (e) {
          console.log("[SignUp] Sync error (handled by AppLayout later):", e);
        }

        router.replace("/trips");
      } else {
        console.log("[SignUp] Verification status not complete:", signUp.status);
        setError("Verification was not completed. Please try again.");
      }
    } catch (err: any) {
      console.error("[SignUp] Verification error:", err);
      const message = getErrorMessage(err, "Invalid or expired verification code.");
      setError(message);
      Alert.alert("Verification Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer>
      {/* Mandatory hidden captcha anchor */}
      <View id="clerk-captcha" />

      <ThemedText style={styles.title}>
        {pendingVerification ? "Check your email" : "Create Account"}
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        {pendingVerification 
          ? `We sent a code to ${email}` 
          : "Sign up to see your trips and events"}
      </ThemedText>

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

      {!pendingVerification ? (
        <>
          <View style={styles.form}>
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
              title={loading ? "Creating Account..." : "Sign Up"}
              onPress={onSignUpPress}
            />
          </View>

          <SocialLoginButtons />

          <View style={styles.footer}>
            <Link href="/sign-in" asChild>
              <TouchableOpacity>
                <ThemedText style={styles.link}>
                  Already have an account? <ThemedText style={styles.linkBold}>Sign in</ThemedText>
                </ThemedText>
              </TouchableOpacity>
            </Link>
          </View>
        </>
      ) : (
        <View style={styles.form}>
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
          
          <TouchableOpacity onPress={() => setPendingVerification(false)} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>Back to Sign Up</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: "center", marginBottom: 32, opacity: 0.6 },
  form: { width: "100%", gap: 4 },
  error: { color: "#ef4444", marginBottom: 16, textAlign: "center", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: 10, borderRadius: 8, overflow: "hidden" },
  footer: { marginTop: 24, alignItems: "center", paddingBottom: 5 },
  link: { fontSize: 15 },
  linkBold: { fontWeight: "700", color: "#4f46e5", paddingLeft: 1 },
  backButton: { marginTop: 16, alignItems: 'center' },
  backButtonText: { color: '#6b7280', fontSize: 14 }
});
