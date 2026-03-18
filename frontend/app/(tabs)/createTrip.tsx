import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Fonts } from '@/constants/theme';
import { useState } from 'react';
import FormInput from '@/components/FormInput';

export default function CreateTripScreen() {
  
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [destination, setDestination] = useState('');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create a Trip ✈️</Text>
        <Text style={styles.subtitle}>
          Plan your next adventure by creating a new trip.
        </Text>

        {/* Trip Name Input */}
        <FormInput
          label="Trip Name"
          placeholder="Enter trip name"
          value={name}
          onChangeText={setName}
        />
        
        {/* Start Date Input */}
        <FormInput
          label="Start Date"
          placeholder="Select start date"
          value={startDate}
          onChangeText={setStartDate}
        />

        {/* End Date Input */}
        <FormInput
          label="End Date"
          placeholder="Select end date"
          value={endDate}
          onChangeText={setEndDate}
        />

        {/* Destination Input */}
        <FormInput
          label="Destination"
          placeholder="Enter trip destination"
          value={destination}
          onChangeText={setDestination}
        />
        
        <TouchableOpacity style={styles.button} onPress={() => alert('Trip created!')}>
          <Text style={styles.buttonText}>Create Trip</Text>
        </TouchableOpacity>
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
    paddingBottom: 40,
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
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
