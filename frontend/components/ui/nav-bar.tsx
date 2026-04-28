import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import type { ViewStyle } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { PlatformPressable } from '@react-navigation/elements';
import { CalendarDays, House, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCalendarActive = pathname === '/events' || pathname.startsWith('/trips');
  const isHomeActive = pathname === '/' || pathname === '/index';
  const isProfileActive = pathname.startsWith('/profile');
  const shouldHideNavbar = pathname === '/trips' || pathname === '/trips/create';
  const isTablet = width >= 768;
  const navHeight = 68 + insets.bottom;

  if (shouldHideNavbar) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <View
        style={[
          styles.navbar,
          {
            height: navHeight,
            paddingBottom: Math.max(insets.bottom, 8),
            paddingHorizontal: isTablet ? 28 : 18,
          },
        ]}
      >
        <PlatformPressable
          accessibilityRole="tab"
          accessibilityLabel="Calendar"
          accessibilityState={{ selected: isCalendarActive }}
          onPress={() => router.navigate('/events')}
          style={[styles.tabButton, isCalendarActive && styles.tabButtonActive]}
        >
          <View style={styles.iconScaleUp}>
            <CalendarDays
              size={isTablet ? 46 : 35}
              strokeWidth={2.4}
              color={isCalendarActive ? '#0b0b0b' : '#ffffff'}
            />
          </View>
        </PlatformPressable>
        <PlatformPressable
          accessibilityRole="tab"
          accessibilityLabel="Home"
          accessibilityState={{ selected: isHomeActive }}
          onPress={() => router.navigate('/')}
          style={[styles.tabButton, isHomeActive && styles.tabButtonActive]}
        >
          <View style={styles.iconScaleUp}>
            <House
              size={isTablet ? 54 : 40}
              strokeWidth={2.6}
              color={isHomeActive ? '#0b0b0b' : '#ffffff'}
            />
          </View>
        </PlatformPressable>
        <PlatformPressable
          accessibilityRole="tab"
          accessibilityLabel="Profile"
          accessibilityState={{ selected: isProfileActive }}
          onPress={() => router.navigate('/profile')}
          style={[styles.tabButton, isProfileActive && styles.tabButtonActive]}
        >
          <View style={styles.iconScaleUp}>
            <User
              size={isTablet ? 52 : 40}
              strokeWidth={2.4}
              color={isProfileActive ? '#0b0b0b' : '#ffffff'}
            />
          </View>
        </PlatformPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  navbar: ViewStyle;
  tabButton: ViewStyle;
  tabButtonActive: ViewStyle;
  iconScaleUp: ViewStyle;
}>({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'flex-end',
  },
  navbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: '#79b9ee',
    borderTopColor: 'transparent',
    paddingTop: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    marginHorizontal: 0,
  },
  tabButtonActive: {
    transform: [{ translateY: -2 }],
  },
  iconScaleUp: {
    transform: [{ scale: 1.15 }, { translateY: 3 }],
  },
});
