import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

import { usePendingInvitationsCount } from '@/hooks/use-pending-invitations-count';
import { useUnreadChats } from '@/hooks/use-unread-chats';

import { IconSymbol } from '@/components/ui/icon-symbol';

type NavItem = {
  name: string;
  href: '/(app)/(tabs)/trips' | '/(app)/(tabs)/my-invitations' | '/(app)/(tabs)/profile' | '/(app)/(tabs)/chats';
  icon: 'suitcase.fill' | 'envelope.fill' | 'person.fill' | 'message.circle.fill';
};

const navItems: NavItem[] = [
  { name: 'My Trips', href: '/(app)/(tabs)/trips', icon: 'suitcase.fill' },
  { name: 'Invitations', href: '/(app)/(tabs)/my-invitations', icon: 'envelope.fill' },
  { name: 'Chats', href: '/(app)/(tabs)/chats', icon: 'message.circle.fill' },
  { name: 'Profile', href: '/(app)/(tabs)/profile', icon: 'person.fill' },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { pendingInvitationsCount } = usePendingInvitationsCount();
  const { hasUnreadChats } = useUnreadChats();

  const isActive = (href: string) => {
    const routeName = href.split('/').pop();
    return pathname.startsWith(`/${routeName}`);
  };

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarContent}>
        <Text style={styles.sidebarTitle}>Rollcall Event</Text>
        <Text style={styles.sidebarSubtitle}>Trip management</Text>
        <View style={styles.divider} />
        {navItems.map((item) => {
          const active = isActive(item.href);
          const shouldShowBadge = item.href === '/(app)/(tabs)/my-invitations' && pendingInvitationsCount > 0;
          const shouldShowChatBadge = item.href === '/(app)/(tabs)/chats' && hasUnreadChats;

          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href)}
              style={({ hovered }) => [
                styles.navItem,
                active && styles.navItemActive,
                hovered && !active && styles.navItemHovered,
              ]}
            >
              {({ hovered }) => (
                <>
                  <View style={styles.iconWrapper}>
                    <IconSymbol
                      size={18}
                      name={item.icon}
                      color={active ? '#76b6ee' : hovered ? '#ffffff' : 'rgba(255,255,255,0.45)'}
                    />
                    {shouldShowBadge || shouldShowChatBadge ? (
                      <View style={styles.badge} />
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.navLabel,
                      active && styles.navLabelActive,
                      hovered && !active && styles.navLabelHovered,
                    ]}
                  >
                    {item.name}
                  </Text>
                </>
              )}
            </Pressable>
          );
        })}
      </View>
      <View pointerEvents="none" style={styles.mountainScene}>
        <View style={[styles.triangle, styles.triangleBack]} />
        <View style={[styles.triangle, styles.triangleMidLeft]} />
        <View style={[styles.triangle, styles.triangleMidRight]} />
        <View style={[styles.triangle, styles.triangleFront]} />
        <View style={[styles.triangle, styles.triangleRight]} />
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
    fontSize: 25,
    fontWeight: '800',
    color: '#76b6ee',
    paddingHorizontal: 20,
    marginBottom: 1,
  },
  navLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  navItemActive: {
    backgroundColor: 'rgba(118, 182, 238, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#76b6ee',
    shadowColor: '#76b6ee',
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
  iconWrapper: {
    position: 'relative',
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#ff3040',
    borderWidth: 2,
    borderColor: '#1a2e44',
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
  mountainScene: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
    zIndex: 1,
  },
  triangle: {
    position: 'absolute',
    bottom: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
  },
  triangleBack: {
    left: -20,
    borderLeftWidth: 70,
    borderRightWidth: 70,
    borderBottomWidth: 90,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#223a5c',
    opacity: 0.92,
  },
  triangleMidLeft: {
    left: 40,
    borderLeftWidth: 40,
    borderRightWidth: 40,
    borderBottomWidth: 60,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#345c87',
    opacity: 0.8,
  },
  triangleMidRight: {
    left: 90,
    borderLeftWidth: 35,
    borderRightWidth: 35,
    borderBottomWidth: 50,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#4a7ca8',
    opacity: 0.7,
  },
  triangleFront: {
    left: 120,
    borderLeftWidth: 22,
    borderRightWidth: 22,
    borderBottomWidth: 32,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#6fa4d6',
    opacity: 0.65,
  },
  triangleRight: {
    position: 'absolute',
    bottom: 0,
    right: -18,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 28,
    borderRightWidth: 28,
    borderBottomWidth: 54,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#345c87',
    opacity: 0.8,
  },
});
