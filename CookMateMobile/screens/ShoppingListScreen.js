import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { cookmateAPI } from '../services/api';
import BottomTabs from '../components/BottomTabs';

const COLORS = { primary: '#2D4F38', background: '#F7F3E8', white: '#FFFFFF', accent: '#D4A056', text: '#1F2937', success: '#22C55E' };

const ShoppingListScreen = ({ navigation, route }) => {
  const userId = route.params?.userId || 1;
  const [list, setList] = useState([]);
  const [selectedItems, setSelectedItems] = useState({}); // Tracks checked items
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchShoppingList();
    }, [])
  );

  const fetchShoppingList = async () => {
    setLoading(true);
    try {
      const data = await cookmateAPI.getShoppingList(userId);
      setList(data.shopping_list || []);
      setSelectedItems({}); // Reset selection
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not generate list.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (item) => {
    setSelectedItems(prev => {
      const newState = { ...prev };
      if (newState[item.name]) {
        delete newState[item.name]; // Uncheck
      } else {
        newState[item.name] = item; // Check (Store whole item)
      }
      return newState;
    });
  };

  const handleRestock = async () => {
    const itemsToBuy = Object.values(selectedItems);
    
    if (itemsToBuy.length === 0) {
      Alert.alert("Select Items", "Tap items to mark them as bought.");
      return;
    }

    setPurchasing(true);
    try {
      // 1. Format for API (The manual add endpoint expects this format)
      // We assume default unit is 'kg' or 'pcs' and price 0 for now
      const payload = itemsToBuy.map(item => ({
        name: item.name,
        quantity: item.suggested_qty,
        unit: 'kg', // Defaulting for MVP
        category: 'Restocked',
        price_per_unit: 0,
        expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // +7 days
      }));

      console.log("Restocking:", payload);

      // 2. Call the "Add Manual" API
      await cookmateAPI.addInventoryItems(userId, payload);

      Alert.alert(
        "Pantry Restocked! 🥬", 
        `Added ${itemsToBuy.length} items to your inventory.`,
        [
          { text: "Awesome", onPress: () => {
             // Refresh list (Bought items should disappear naturally as qty > 0)
             fetchShoppingList(); 
          }}
        ]
      );

    } catch (error) {
      Alert.alert("Error", "Could not update pantry.");
    } finally {
      setPurchasing(false);
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = !!selectedItems[item.name];
    
    return (
      <TouchableOpacity 
        style={[styles.card, isSelected && styles.cardSelected]} 
        onPress={() => toggleSelection(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconBox}>
          <Ionicons 
            name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
            size={28} 
            color={isSelected ? COLORS.success : COLORS.text} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemName, isSelected && styles.textStrike]}>{item.name}</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>
        <View style={styles.qtyBox}>
          <Text style={styles.qtyText}>+{item.suggested_qty}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping List 🛒</Text>
        <Text style={styles.subtitle}>Tap items to mark as bought.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="checkmark-done-circle-outline" size={80} color={COLORS.success} />
              <Text style={styles.emptyText}>All stocked up!</Text>
            </View>
          }
        />
      )}

      {/* FLOATING ACTION BUTTON (Only shows when items are selected) */}
      {Object.keys(selectedItems).length > 0 && (
        <View style={styles.fabContainer}>
          <TouchableOpacity style={styles.fab} onPress={handleRestock} disabled={purchasing}>
            {purchasing ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="basket" size={24} color={COLORS.white} />
                <Text style={styles.fabText}>Restock {Object.keys(selectedItems).length} Items</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <BottomTabs navigation={navigation} activeTab="Inventory" userId={userId} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 50 },
  header: { paddingHorizontal: 20, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary },
  subtitle: { color: COLORS.textSecondary, marginTop: 5 },
  
  card: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 15, borderRadius: 16, marginBottom: 12, alignItems: 'center', elevation: 2, borderWidth: 1, borderColor: 'transparent' },
  cardSelected: { backgroundColor: '#F0FDF4', borderColor: COLORS.success },
  
  iconBox: { marginRight: 15 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  textStrike: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
  
  reasonText: { fontSize: 12, color: COLORS.accent, fontWeight: 'bold' },
  qtyBox: { backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  qtyText: { color: COLORS.primary, fontWeight: 'bold' },

  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 15, fontSize: 18, color: COLORS.textSecondary },

  fabContainer: { position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center' },
  fab: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, elevation: 10, alignItems: 'center', gap: 10 },
  fabText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' }
});

export default ShoppingListScreen;