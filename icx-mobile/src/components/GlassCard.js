import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

export default function GlassCard({ children, className, intensity = "medium", style }) {
  const blurAmount = intensity === "high" ? 80 : 30; 
  const overlayColor = intensity === "high" ? "rgba(255, 248, 240, 0.85)" : "rgba(255, 255, 255, 0.45)";

  return (
    <View 
      className={`rounded-[32px] border border-white/60 overflow-hidden relative ${className}`}
      style={[{
          shadowColor: "#2F3E32", 
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 10,
          backgroundColor: 'transparent', 
        }, style]}
    >
      <BlurView intensity={blurAmount} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]} />
      <View style={{ zIndex: 1 }}>{children}</View>
    </View>
  );
}