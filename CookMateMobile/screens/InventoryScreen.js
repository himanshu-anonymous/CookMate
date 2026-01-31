import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { cookmateAPI } from '../services/api';
import BottomTabs from '../components/BottomTabs'; // <--- NEW BAR

const COLORS = { primary: '#2D4F38', background: '#F7F3E8', white: '#FFFFFF', accent: '#D4A056', text: '#1F2937' };

const COMMON_VEG = [
  { id: 'v1', name: 'Onion', icon: '🧅' },
  { id: 'v2', name: 'Tomato', icon: '🍅' },
  { id: 'v3', name: 'Potato', icon: '🥔' },
  { id: 'v4', name: 'Carrot', icon: '🥕' },
  { id: 'v5', name: 'Spinach', icon: '🌿' },
  { id: 'v6', name: 'Garlic', icon: '🧄' },
  { id: 'v7', name: 'Milk', icon: '🥛' },
  { id: 'v8', name: 'Eggs', icon: '🥚' },
];

const InventoryScreen = ({ navigation, route }) => {
  const userId = route.params?.userId || 1; 

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});

  // 🔄 AUTO-REFRESH: Fetches fresh data every time you look at the screen
  useFocusEffect(
    useCallback(() => {
      fetchInventory();
    }, [userId])
  );

  const fetchInventory = async () => {
    setLoading(true);
    try {
      console.log(`Fetching pantry for User ${userId}...`);
      const data = await cookmateAPI.getInventory(userId);
      setInventory(data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- MANUAL ADD LOGIC ---
  const toggleSelection = (name) => {
    setSelectedItems(prev => {
      const newState = { ...prev };
      if (newState[name]) delete newState[name];
      else newState[name] = ""; 
      return newState;
    });
  };

  const updateQuantity = (name, qty) => {
    setSelectedItems(prev => ({ ...prev, [name]: qty }));
  };

  const handleManualAdd = async () => {
    const itemsToSend = [];
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7); 

    Object.keys(selectedItems).forEach(name => {
      const qty = parseFloat(selectedItems[name]);
      if (qty > 0) {
        // 🛠 FIX: Added missing fields (price, unit, category) so Backend accepts it
        itemsToSend.push({
          name: name,
          quantity: qty,
          unit: name === 'Eggs' ? 'pcs' : 'kg', // Smart units
          category: "Vegetable",
          expiry_date: nextWeek.toISOString(),
          price_per_unit: 0 // Default price to prevent errors
        });
      }
    });

    if (itemsToSend.length === 0) {
      Alert.alert("Empty", "Please enter quantities.");
      return;
    }

    try {
      console.log("Sending Manual Items:", itemsToSend);
      await cookmateAPI.addInventoryItems(userId, itemsToSend);
      
      Alert.alert("Success", "Items added to pantry!");
      setModalVisible(false);
      setSelectedItems({});
      fetchInventory(); // 🔄 Instant Refresh
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not add items. Check console.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.iconBox}><Text style={{fontSize: 20}}>🥗</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemMeta}>{item.category} • {item.unit}</Text>
      </View>
      <View style={styles.qtyBadge}>
        <Text style={styles.qtyText}>{item.quantity}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Pantry 🥬</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={32} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="small" color={COLORS.primary} />}

      <FlatList
        data={inventory}
        keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }} // Space for Bottom Bar
        ListEmptyComponent={<Text style={styles.emptyText}>Pantry is empty.</Text>}
      />

      {/* MANUAL ADD MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Add</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {COMMON_VEG.map((veg) => {
                const isChecked = selectedItems.hasOwnProperty(veg.name);
                return (
                  <View key={veg.id} style={[styles.vegRow, isChecked && styles.vegRowActive]}>
                    <TouchableOpacity style={styles.checkboxContainer} onPress={() => toggleSelection(veg.name)}>
                      <Ionicons name={isChecked ? "checkbox" : "square-outline"} size={24} color={isChecked ? COLORS.primary : COLORS.text} />
                      <Text style={styles.vegName}>{veg.icon} {veg.name}</Text>
                    </TouchableOpacity>
                    {isChecked && (
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.qtyInput}
                          placeholder="0"
                          keyboardType="numeric"
                          value={selectedItems[veg.name]}
                          onChangeText={(t) => updateQuantity(veg.name, t)}
                        />
                        <Text style={styles.unitText}>{veg.name === 'Eggs' ? 'pcs' : 'kg'}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.doneBtn} onPress={handleManualAdd}>
              <Text style={styles.doneText}>Save Items</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🧭 NAVIGATION BAR */}
      <BottomTabs navigation={navigation} activeTab="Inventory" userId={userId} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  itemCard: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 15, borderRadius: 16, marginBottom: 10, alignItems: 'center', elevation: 2 },
  iconBox: { width: 40, height: 40, backgroundColor: '#F3F4F6', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  itemMeta: { fontSize: 12, color: '#6B7280' },
  qtyBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  qtyText: { color: COLORS.primary, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#6B7280', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, height: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  vegRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  vegRowActive: { backgroundColor: '#F0FDF4', marginHorizontal: -20, paddingHorizontal: 20 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  vegName: { fontSize: 16, color: COLORS.text },
  inputContainer: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  qtyInput: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 5, width: 60, textAlign: 'center' },
  unitText: { color: '#6B7280', fontSize: 14 },
  doneBtn: { backgroundColor: COLORS.accent, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  doneText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 }
});

export default InventoryScreen;