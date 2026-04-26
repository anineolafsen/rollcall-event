import { Platform, View, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import { AppNavbar } from '@/components/ui/nav-bar';
import { AppSidebar } from '@/components/ui/side-bar';

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 900;

  if (isDesktopWeb) {
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
