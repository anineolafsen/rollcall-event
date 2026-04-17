import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type NavItem = {
  name: string;
  href: '/(app)/(tabs)/trips' | '/(app)/(tabs)/my-invitations';
  icon: 'suitcase.fill' | 'envelope.fill';
};

const navItems: NavItem[] = [
  { name: 'Trips', href: '/(app)/(tabs)/trips', icon: 'suitcase.fill' },
  { name: 'Invitations', href: '/(app)/(tabs)/my-invitations', icon: 'envelope.fill' },
];

export function AppSidebar() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isActive = (href: string) => {
    return pathname === href || pathname.includes(href.split('/')[2]);
  };

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarContent}>
        <Text style={styles.sidebarTitle}>Rollcall Event</Text>
        {navItems.map((item) => {
          const active = isActive(item.href);
          const hovered = hoveredItem === item.href;
          return (
            <View
              key={item.href}
              onMouseEnter={() => setHoveredItem(item.href)}
              onMouseLeave={() => setHoveredItem(null)}
              style={[styles.navItem, active && styles.navItemActive]}
              {...({ onMouseEnter: () => setHoveredItem(item.href), onMouseLeave: () => setHoveredItem(null) } as any)}>
              <Pressable
                onPress={() => router.push(item.href)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <IconSymbol
                  size={24}
                  name={item.icon}
                  color={active ? tintColor : '#00C49A'}
                />
                <Text style={[styles.navLabel, active && styles.navLabelActive, hovered && styles.navLabelHovered]}>
                  {item.name}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 250,
    backgroundColor: '#343434',
    borderRightWidth: 1,
    borderRightColor: '#343434',
    paddingTop: 20,
  },
  sidebarContent: {
    gap: 8,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#77C6FE',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    paddingLeft: 12,
  },
  navLabel: {
    fontSize: 16,
    color: '#F4FAFF',
  },
  navLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  navLabelHovered: {
    color: '#00C49A',
  },
});
