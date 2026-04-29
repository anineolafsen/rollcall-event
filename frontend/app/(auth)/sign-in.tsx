import { View, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";
import { useSignIn, useAuth } from "@clerk/expo";
import { Link, Redirect, useRouter } from "expo-router";

import AuthInput from "@/components/AuthInput";
import AuthButton from "@/components/AuthButton";
import ThemedText from "@/components/ThemedText";

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

  // Redirect away if already signed in
  if (authLoaded && isSignedIn) {
    return <Redirect href="/trips" />;
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
        console.log("Sign in incomplete:", JSON.stringify(signIn, null, 2));
        setError(message);
        Alert.alert("Sign In Failed", message);
        return;
      }

      await signIn.finalize();

      router.replace("/trips");
    } catch (err: any) {
      console.log("Sign in error:", JSON.stringify(err, null, 2));
      const message = getErrorMessage(err, "Something went wrong during sign in.");
      setError(message);
      Alert.alert("Sign In Failed", message);
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
            Don&apos;t have an account? Sign up
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
