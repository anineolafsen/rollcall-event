import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type NavItem = {
  name: string;
  href: '/(app)/(tabs)/trips' | '/(app)/(tabs)/my-invitations' | '/(app)/(tabs)/profile';
  icon: 'suitcase.fill' | 'envelope.fill' | 'person.fill';
};

const navItems: NavItem[] = [
  { name: 'My Trips', href: '/(app)/(tabs)/trips', icon: 'suitcase.fill' },
  { name: 'Invitations', href: '/(app)/(tabs)/my-invitations', icon: 'envelope.fill' },
  { name: 'Profile', href: '/(app)/(tabs)/profile', icon: 'person.fill' },
];

export function AppSidebar() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isActive = (href: string) => {
    return pathname === href || pathname.includes(href.split('/')[1]);
  };

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarContent}>
        <Text style={styles.sidebarTitle}>Rollcall Event</Text>
        <Text style={styles.sidebarSubtitle}>Trip management</Text>
        <View style={styles.divider} />
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
              <Pressable
                key={item.href}
                onPress={() => router.push(item.href)}
                style={({ hovered }) => [
                  styles.navItem,
                  active && styles.navItemActive,
                  hovered && styles.navItemHovered,
                ]}>
                  {({ hovered }) => (
                    <>
                    <IconSymbol
                      size={18}                                         
                      name={item.icon}
                      color={active || hovered ? '#ffffff' : 'rgba(255,255,255,0.45)'}  
                    />
                    <Text style={[styles.navLabel, active && styles.navLabelActive, hovered && {color: '#ffffff' },]}>
                      {item.name}
                    </Text>
                  </>
                  )}
              </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 220,
    backgroundColor: '#1a2e44',
    borderRightWidth: 0,
    paddingTop: 20,
  },
  sidebarContent: {
    gap: 4,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#76b6ee',
    paddingHorizontal: 20,
    marginBottom: 1,
  },
  sidebarSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  navLabel: {
    fontSize: 16,
    color: 'rgba(252, 252, 252, 0.63)',
  },
  navLabelHovered: {
    color: '#ffffff',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 0,
    marginBottom: 8,
    marginTop: 16,
  },
  navItemHovered: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderLeftWidth: 3,
    borderLeftColor: '#76b6ee',
},
});
