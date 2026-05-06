import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/expo';

export default function IndexPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href="/trips" />;
  }

  return <Redirect href="/sign-in" />;
}
