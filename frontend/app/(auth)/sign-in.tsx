import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";
import { useSignIn, useAuth } from "@clerk/clerk-expo";
import { Redirect, useRouter } from "expo-router";
import { Link } from "expo-router";

import AuthInput from "@/components/AuthInput";
import AuthButton from "@/components/AuthButton";
import ThemedText from "@/components/ThemedText";

export default function SignInPage() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redirect away if already signed in
if (authLoaded && isSignedIn) {
  return <Redirect href="/" />;
}

  const onSignInPress = async () => {
    if (!isLoaded) return;

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      await setActive({ session: result.createdSessionId });

      router.replace("/"); // go to app root
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View >
      <ThemedText style={styles.title}>Sign In</ThemedText>
      <AuthInput 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} />
      <AuthInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <AuthButton title="Sign In" onPress={onSignInPress} />
      <Link href="/sign-up" asChild>
      <TouchableOpacity>
        <ThemedText style={{ marginTop: 16, textAlign: "center" }}>
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
    //justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
  },
});