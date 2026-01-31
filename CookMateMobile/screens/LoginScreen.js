import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ImageBackground } from 'react-native';
import { cookmateAPI } from '../services/api';

const COLORS = { primary: '#2D4F38', background: '#F7F3E8', white: '#FFFFFF', accent: '#D4A056' };

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Please enter your username.");
      return;
    }

    setLoading(true);
    try {
      console.log(`Attempting login for: ${username}`);
      const user = await cookmateAPI.loginUser(username);
      
      console.log("Login Success:", user);
      
      // Navigate to Home with the CORRECT User ID
      navigation.replace('Home', { userId: user.id, username: user.username });

    } catch (error) {
      console.error(error);
      Alert.alert("Login Failed", "User not found. Please create a profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back Chef! 👨‍🍳</Text>
        <Text style={styles.subtitle}>Enter your name to access your kitchen.</Text>

        <TextInput
          style={styles.input}
          placeholder="Username (e.g. Himanshu)"
          placeholderTextColor="#9CA3AF"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
        ) : (
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.btnText}>Enter Kitchen</Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider} />

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>New here? <Text style={{fontWeight: 'bold', color: COLORS.accent}}>Create Profile</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: COLORS.background, padding: 30, borderRadius: 20, alignItems: 'center', elevation: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, marginBottom: 10, textAlign: 'center' },
  subtitle: { color: COLORS.textSecondary, marginBottom: 30, textAlign: 'center' },
  input: { width: '100%', backgroundColor: COLORS.white, padding: 15, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
  loginBtn: { width: '100%', backgroundColor: COLORS.primary, padding: 18, borderRadius: 16, alignItems: 'center', elevation: 5 },
  btnText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  divider: { height: 1, width: '100%', backgroundColor: '#E5E7EB', marginVertical: 20 },
  linkText: { color: '#6B7280', fontSize: 16 }
});

export default LoginScreen;