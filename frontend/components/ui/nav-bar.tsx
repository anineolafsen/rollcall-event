import React from 'react';
import { StyleSheet } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { PlatformPressable } from '@react-navigation/elements';

import { IconSymbol } from '@/components/ui/icon-symbol';

const hiddenTabOptions = {
  href: null,
  tabBarItemStyle: {
    display: 'none' as const,
  },
};

export function AppNavbar() {
  const pathname = usePathname();
  const isCalendarActive = pathname === '/events' || pathname.startsWith('/trips');
  const isHomeActive = pathname === '/' || pathname === '/index';
  const isProfileActive = pathname.startsWith('/profile');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0b0b0b',
        tabBarInactiveTintColor: '#ffffff',
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          height: 70,
          backgroundColor: '#79b9ee',
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          paddingTop: 14,
          paddingBottom: 8,
          paddingHorizontal: 18,
          shadowColor: '#000000',
          shadowOpacity: 0.2,
          shadowRadius: 14,
          shadowOffset: {
            width: 0,
            height: 8,
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
            <IconSymbol size={40} name="calendar" color={isCalendarActive ? '#0b0b0b' : '#ffffff'} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: () => (
            <IconSymbol size={53} name="house.fill" color={isHomeActive ? '#0b0b0b' : '#ffffff'} />
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
            <IconSymbol size={50} name="person.fill" color={isProfileActive ? '#0b0b0b' : '#ffffff'} />
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
