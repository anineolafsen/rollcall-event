import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { PlatformPressable } from '@react-navigation/elements';
import { CalendarDays, House, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const hiddenTabOptions = {
  href: null,
  tabBarItemStyle: {
    display: 'none' as const,
  },
};

export function AppNavbar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCalendarActive = pathname === '/events' || pathname.startsWith('/trips');
  const isHomeActive = pathname === '/' || pathname === '/index';
  const isProfileActive = pathname.startsWith('/profile');
  const shouldHideNavbar = pathname === '/trips';
  const isTablet = width >= 768;
  const navHeight = 76 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0b0b0b',
        tabBarInactiveTintColor: '#ffffff',
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          display: shouldHideNavbar ? 'none' : 'flex',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: navHeight,
          backgroundColor: '#79b9ee',
          borderTopColor: 'transparent',
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingHorizontal: isTablet ? 28 : 18,
          shadowColor: '#000000',
          shadowOpacity: 0.28,
          shadowRadius: 18,
          shadowOffset: {
            width: 0,
            height: 10,
          },
          elevation: 10,
        },
        tabBarButton: (props) => (
          <PlatformPressable
            {...props}
            style={[
              styles.tabButton,
              props.style,
              props.accessibilityState?.selected && styles.tabButtonActive,
            ]}
          >
            {props.children}
          </PlatformPressable>
        ),
        headerShown: false,
      }}>
      <Tabs.Screen
        name="events"
        options={{
          title: 'Calendar',
          tabBarIcon: () => (
            <CalendarDays
              size={isTablet ? 42 : 38}
              strokeWidth={2.4}
              color={isCalendarActive ? '#0b0b0b' : '#ffffff'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: () => (
            <House
              size={isTablet ? 50 : 46}
              strokeWidth={2.6}
              color={isHomeActive ? '#0b0b0b' : '#ffffff'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={hiddenTabOptions}
      />
      <Tabs.Screen
        name="my-invitations"
        options={hiddenTabOptions}
      />
      <Tabs.Screen
        name="invite"
        options={hiddenTabOptions}
      />
      <Tabs.Screen
        name="trips/create"
        options={hiddenTabOptions}
      />
      <Tabs.Screen
        name="trips/[id]"
        options={hiddenTabOptions}
      />
      <Tabs.Screen
        name="trips/[id]/edit"
        options={hiddenTabOptions}
      />
      <Tabs.Screen
        name="trips/[id]/manage-invitations"
        options={hiddenTabOptions}
      />
      <Tabs.Screen
        name="trips/[id]/participant-needs"
        options={hiddenTabOptions}
      />
      <Tabs.Screen
        name="trips/[id]/notify"
        options={hiddenTabOptions}
      />
      <Tabs.Screen
        name="events/create"
        options={hiddenTabOptions}
      />
      <Tabs.Screen
        name="events/[id]"
        options={hiddenTabOptions}
      />
      <Tabs.Screen
        name="events/[id]/edit"
        options={hiddenTabOptions}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: () => (
            <User
              size={isTablet ? 48 : 44}
              strokeWidth={2.4}
              color={isProfileActive ? '#0b0b0b' : '#ffffff'}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
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
});
