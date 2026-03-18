import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";
import { useSignIn, useAuth } from "@clerk/clerk-expo";
import { Redirect, useRouter, Link } from "expo-router";

import AuthInput from "@/components/AuthInput";
import AuthButton from "@/components/AuthButton";
import ThemedText from "@/components/ThemedText";

export default function SignInPage() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoaded && isSignedIn) {
    return <Redirect href="/" />;
  }

  const onSignInPress = async () => {
    if (!isLoaded || loading) return;

    try {
      setLoading(true);
      setError("");

      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });
      console.log("signIn result:", JSON.stringify(result, null, 2));

      await setActive({ session: result.createdSessionId });

      console.log("setActive done, navigating...");
    } catch (err: any) {
      console.log("Sign in error:", JSON.stringify(err, null, 2));
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Sign In</ThemedText>

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

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
      <Link href="/sign-up" asChild>
        <TouchableOpacity>
          <ThemedText style={styles.link}>
            Don't have an account? Sign up
          </ThemedText>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    //justifyContent: "center",
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
  },
  error: {
    color: "red",
    marginBottom: 12,
  },
  link: {
    marginTop: 16,
    textAlign: "center",
  },
});