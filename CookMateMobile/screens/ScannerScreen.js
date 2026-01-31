import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { cookmateAPI } from '../services/api';

const ScannerScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleUpload = async () => {
    if (!image) return;
    setLoading(true);
    try {
      // Hardcoded User ID 1 for Demo
      const response = await cookmateAPI.scanBill(1, image);
      Alert.alert("Success", `Added ${response.items_added} items!`);
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert("Error", "Backend disconnected.");
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) return <View />;
  if (hasPermission === false) return <Text>No camera access</Text>;

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
            <Text style={{ marginTop: 10, color: COLORS.textSecondary }}>Tap to Upload</Text>
          </TouchableOpacity>
        )}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          <TouchableOpacity style={[styles.btn, !image && {backgroundColor: 'gray'}]} onPress={handleUpload} disabled={!image}>
            <Text style={styles.btnText}>Analyze</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  uploadBox: { width: '100%', height: 300, backgroundColor: COLORS.white, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.accent, borderStyle: 'dashed' },
  preview: { width: '100%', height: 400, borderRadius: 20, marginBottom: 20 },
  btn: { backgroundColor: COLORS.primary, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, marginTop: 30, ...SHADOWS.medium },
  btnText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' }
});

export default ScannerScreen;