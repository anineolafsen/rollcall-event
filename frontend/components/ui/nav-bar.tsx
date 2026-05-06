import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import type { ViewStyle } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { PlatformPressable } from '@react-navigation/elements';
import { CalendarDays, House, MessageCircle, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUnreadChats } from '@/hooks/use-unread-chats';
import { useMobileTripStore } from '@/lib/mobile-trip-store';

const TRIP_HOME_RE = /^\/trips\/[^/]+$/;

export function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { hasUnreadChats } = useUnreadChats();
  const selectedTripId = useMobileTripStore((state) => state.selectedTripId);

  const isTripHome = TRIP_HOME_RE.test(pathname);
  const isHomeActive = pathname === '/' || pathname === '/index' || isTripHome;
  const isCalendarActive = pathname === '/events' || (pathname.startsWith('/trips') && !isTripHome);
  const isChatsActive = pathname === '/chats' || pathname.startsWith('/chats/');
  const isProfileActive = pathname.startsWith('/profile');
  const shouldHideNavbar = pathname === '/trips' || pathname === '/trips/create';
  const isTablet = width >= 768;
  const navHeight = 58 + insets.bottom;

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
          accessibilityLabel="Home"
          accessibilityState={{ selected: isHomeActive }}
          onPress={() =>
            selectedTripId ? router.navigate(`/trips/${selectedTripId}`) : router.navigate('/trips')
          }
          style={[styles.tabButton, isHomeActive && styles.tabButtonActive]}
        >
          <View style={styles.iconScaleUp}>
            <House
              size={isTablet ? 47 : 34}
              strokeWidth={2.6}
              color={isHomeActive ? '#0b0b0b' : '#ffffff'}
            />
          </View>
        </PlatformPressable>
        <PlatformPressable
          accessibilityRole="tab"
          accessibilityLabel="Upcoming events"
          accessibilityState={{ selected: isCalendarActive }}
          onPress={() => router.navigate('/events')}
          style={[styles.tabButton, isCalendarActive && styles.tabButtonActive]}
        >
          <View style={styles.iconScaleUp}>
            <CalendarDays
              size={isTablet ? 40 : 30}
              strokeWidth={2.4}
              color={isCalendarActive ? '#0b0b0b' : '#ffffff'}
            />
          </View>
        </PlatformPressable>
        <PlatformPressable
          accessibilityRole="tab"
          accessibilityLabel="Chats"
          accessibilityState={{ selected: isChatsActive }}
          onPress={() => router.navigate('/chats')}
          style={[styles.tabButton, isChatsActive && styles.tabButtonActive]}
        >
          <View style={styles.iconWrapper}>
            <View style={styles.iconScaleUp}>
              <MessageCircle
                size={isTablet ? 42 : 31}
                strokeWidth={2.4}
                color={isChatsActive ? '#0b0b0b' : '#ffffff'}
              />
            </View>
            {hasUnreadChats ? <View style={styles.badge} /> : null}
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
              size={isTablet ? 45 : 34}
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
  iconWrapper: ViewStyle;
  iconScaleUp: ViewStyle;
  badge: ViewStyle;
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
    backgroundColor: '#rgba(74, 124, 168, 1.00)',
    borderTopColor: 'transparent',
    paddingTop: 4,
    shadowColor: '#ffffffff',
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
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconScaleUp: {
    transform: [{ scale: 1.04 }, { translateY: 1 }],
  },
  badge: {
    position: 'absolute',
    top: 1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: '#ff3040',
    borderWidth: 2,
    borderColor: 'rgba(74, 124, 168, 1)',
  },
});
