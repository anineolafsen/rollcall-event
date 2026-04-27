import { Redirect, Slot } from "expo-router";
import { View } from 'react-native';
import { useAuth } from "@clerk/expo";

import { TripsBackButton } from '@/components/ui/trips-back-button';

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null; // wait for Clerk to initialize

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Slot />
      <TripsBackButton />
    </View>
  );
}
