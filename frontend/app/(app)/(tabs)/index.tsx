import { View } from 'react-native';
import { Text, StyleSheet, ScrollView } from 'react-native';

export default function Home() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Home! 🏠</Text>
                <Text style={styles.subtitle}>
          This is your home screen. Add your app content here.
        </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', 
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  sectionText: {
    fontSize: 20,
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
  },
});
