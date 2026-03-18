// Import View to create containers and layout
import { View } from 'react-native';
// Import Text component to display text
import { Text, StyleSheet, ScrollView } from 'react-native';

// Home screen component - this is the main tab screen
export default function Home() {
  return (
    // ScrollView allows content to be scrollable if it exceeds screen height
    <ScrollView style={styles.container}>

      {/* Main content area with padding */}
      <View style={styles.content}>

        {/* Display a title */}
        <Text style={styles.title}>Welcome Home! 🏠</Text>
        
        {/* Display a subtitle with explanation */}
        <Text style={styles.subtitle}>
          This is your home screen. Add your app content here.
        </Text>
        
        {/* Example section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Getting Started:</Text>
          <Text style={styles.sectionText}>• Create your app components here</Text>
          <Text style={styles.sectionText}>• Use View for layout and spacing</Text>
          <Text style={styles.sectionText}>• Use Text to display content</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// StyleSheet.create() optimizes your styles for better performance
const styles = StyleSheet.create({
  // Container style for the entire screen
  container: {
    flex: 1, // Takes up all available space
    backgroundColor: '#fff', // White background
  },
  // Content area with padding
  content: {
    padding: 20, // Space around all sides
  },
  // Main title style
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  // Subtitle style
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  // Section container
  section: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  // Section title
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  // Section text items
  sectionText: {
    fontSize: 20,
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
  },
});