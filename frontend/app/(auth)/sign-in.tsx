import Mountains from '@/components/ui/mountains';
import { View, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";
import { useSignIn, useAuth } from "@clerk/expo";
import { Link, Redirect, useRouter } from "expo-router";

import AuthInput from "@/components/AuthInput";
import AuthButton from "@/components/AuthButton";
import SocialLoginButtons from "@/components/SocialLoginButtons";
import ThemedText from "@/components/ThemedText";
import AuthContainer from "@/components/AuthContainer";

export default function SignInPage() {
  const { signIn } = useSignIn();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (err: any, fallback: string) =>
    err?.errors?.[0]?.longMessage ||
    err?.errors?.[0]?.message ||
    err?.message ||
    fallback;

  if (authLoaded && isSignedIn) {
    return <Redirect href="/" />;
  }

  const onSignInPress = async () => {
    if (!signIn || loading) return;

    try {
      setLoading(true);
      setError("");

      await signIn.create({
        identifier: email.trim(),
      });

      await signIn.password({
        password,
      });

      if (signIn.status !== "complete") {
        const message = "Sign in was not completed. Please try again.";
        setError(message);
        return;
      }

      await signIn.finalize();
      router.replace("/trips");
    } catch (err: any) {
      const message = getErrorMessage(err, "Something went wrong during sign in.");
      setError(message);
      Alert.alert("Sign In Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer>
      <ThemedText style={styles.title}>Sign In</ThemedText>
      <ThemedText style={styles.subtitle}>Sign in to see your trips and events</ThemedText>

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

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
          title={loading ? "Signing In..." : "Sign In"}
          onPress={onSignInPress}
        />
      </View>

      <SocialLoginButtons />

      <View style={styles.footer}>
        <Link href="/sign-up" asChild>
          <TouchableOpacity>
            <ThemedText style={styles.link}>
              Don&apos;t have an account? <ThemedText style={styles.linkBold}>Sign up</ThemedText>
            </ThemedText>
          </TouchableOpacity>
        </Link>
      </View>
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
  error: {
    color: "#ef4444",
    marginBottom: 16,
    textAlign: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
  footer: {
    marginTop: 24,
    alignItems: "center",
    paddingBottom: 5,
  },
  link: {
    fontSize: 15,
  },
  linkBold: {
    fontWeight: "700",
    color: "#4f46e5",
  },
});
