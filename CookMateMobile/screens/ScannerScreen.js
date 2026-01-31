import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { cookmateAPI } from '../services/api';

const COLORS = { primary: '#2D4F38', background: '#F7F3E8', white: '#FFFFFF', accent: '#D4A056', textSecondary: '#6B7280' };

const ScannerScreen = ({ navigation, route }) => {
  const userId = route.params?.userId || 1;
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // We removed the complex permission check to keep it simple.
    // Expo handles the permission request automatically when launchImageLibraryAsync is called.
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        // 🔙 REVERTED: Using the older option that works for your version
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not open gallery.");
    }
  };

  const handleUpload = async () => {
    if (!image) return;
    setLoading(true);
    try {
      console.log(`Uploading bill for User ${userId}...`);
      
      // Call the API (which uses the new 'fetch' fix)
      const response = await cookmateAPI.scanBill(userId, image);
      
      Alert.alert(
        "Success! 🥬", 
        `Added ${response.items_added || "items"} to your pantry.`,
        [{ text: "View Pantry", onPress: () => navigation.navigate('Inventory', { userId: userId }) }]
      );
    } catch (error) {
      console.error("Upload Failed:", error);
      Alert.alert("Upload Failed", "Check your backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Scan Bill</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        {image ? (
          <Image source={{ uri: image }} style={styles.preview} />
        ) : (
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            <Ionicons name="cloud-upload-outline" size={50} color={COLORS.accent} />
            <Text style={styles.textSecondary}>Tap to Upload Bill</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 20}} />
        ) : (
          <View style={{ width: '100%', alignItems: 'center' }}>
            {image && (
              <TouchableOpacity style={styles.btn} onPress={handleUpload}>
                <Text style={styles.btnText}>Analyze & Add Items</Text>
              </TouchableOpacity>
            )}
            {image && (
              <TouchableOpacity onPress={() => setImage(null)} style={{ marginTop: 20 }}>
                <Text style={{ color: COLORS.textSecondary }}>Retake</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  uploadBox: { width: '100%', height: 300, backgroundColor: COLORS.white, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.accent, borderStyle: 'dashed' },
  preview: { width: '100%', height: 400, borderRadius: 20, marginBottom: 20 },
  btn: { backgroundColor: COLORS.primary, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, marginTop: 10, elevation: 5 },
  btnText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  textSecondary: { marginTop: 10, color: COLORS.textSecondary, fontSize: 16 }
});

export default ScannerScreen;