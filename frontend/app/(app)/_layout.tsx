import { Redirect, Slot } from "expo-router";
import { useAuth } from "@clerk/expo";

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null; // wait for Clerk to initialize

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  return <Slot />;
}
