import React from 'react';
import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { PlatformPressable } from '@react-navigation/elements';

import { IconSymbol } from '@/components/ui/icon-symbol';

export function AppNavbar() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#77C6FE',
        tabBarInactiveTintColor: '#77C6FE',
        tabBarStyle: {
          backgroundColor: '#343434',
          borderTopColor: '#343434',
        },
        tabBarLabelStyle: {
          color: '#F4FAFF', 
        },
        tabBarButton: (props) => (
          <PlatformPressable
            {...props}
            style={[
              props.style,
              styles.tabButton,
              props.accessibilityState?.selected && styles.tabButtonActive,
            ]}
          >
            {props.children}
          </PlatformPressable>
        ),
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="suitcase.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    borderTopWidth: 2,
    borderTopColor: 'transparent',
  },
  tabButtonActive: {
    borderTopColor: '#77C6FE',
  },
});
