import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function Mountains({ style }: { style?: any }) {
  return (
    <View pointerEvents="none" style={[styles.mountainScene, style]}>
      <View style={[styles.triangle, styles.triangleBack]} />
      <View style={[styles.triangle, styles.triangleMidLeft]} />
      <View style={[styles.triangle, styles.triangleMidRight]} />
      <View style={[styles.triangle, styles.triangleFront]} />
      <View style={[styles.triangle, styles.triangleRight]} />
    </View>
  );
}

const styles = StyleSheet.create({
  mountainScene: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 170, // Increased height
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
    borderLeftWidth: 110,
    borderRightWidth: 110,
    borderBottomWidth: 140,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#223a5c',
    opacity: 0.92,
  },
  triangleMidLeft: {
    left: 60,
    borderLeftWidth: 60,
    borderRightWidth: 60,
    borderBottomWidth: 90,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#345c87',
    opacity: 0.8,
  },
  triangleMidRight: {
    left: 140,
    borderLeftWidth: 55,
    borderRightWidth: 55,
    borderBottomWidth: 80,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#4a7ca8',
    opacity: 0.7,
  },
  triangleFront: {
    left: 200,
    borderLeftWidth: 35,
    borderRightWidth: 35,
    borderBottomWidth: 50,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#6fa4d6',
    opacity: 0.65,
  },
  triangleRight: {
    position: 'absolute',
    bottom: 0,
    right: -28,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 45,
    borderRightWidth: 45,
    borderBottomWidth: 80,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#345c87',
    opacity: 0.8,
  },
});
