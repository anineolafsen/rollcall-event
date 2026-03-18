import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    // ThemeProvider applies the chosen theme throughout the app
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      
      {/* Stack manages navigation between screens */}
      <Stack>

        {/* Main tab navigation screen - headerShown: false hides the header */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Modal screen - presentation: 'modal' makes it slide in from bottom */}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>

      {/* StatusBar controls the app's status bar (time, battery, etc.) */}
      <StatusBar hidden />
    </ThemeProvider>
  );
}
