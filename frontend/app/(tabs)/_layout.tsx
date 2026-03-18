import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { AppNavbar } from '@/components/ui/nav-bar';
import { AppSidebar } from '@/components/ui/side-bar';

export default function TabLayout() {
  const isWeb = Platform.OS === 'web';

  if (isWeb) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <AppSidebar />
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </View>
      </View>
    );
  }

  return <AppNavbar />;
}
