import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Mountains from './ui/mountains';

interface AuthContainerProps {
  children: React.ReactNode;
}

export default function AuthContainer({ children }: AuthContainerProps) {
  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Mountains />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a2e44', 
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400, // Standard modern web width for auth cards
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#eef5fb', 
    // On web we'll have a subtle shadow/border
    ...Platform.select({
      web: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
    }),
  },
});
