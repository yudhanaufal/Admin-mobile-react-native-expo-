import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Produk } from "../models/Produk";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function ProductDetail() {
  const route = useRoute<any>();
  const nav = useNavigation();
  const produk: Produk = route.params?.produk || {};

  // Colors
  const colors = {
    primary: '#4a6da7',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    white: '#ffffff',
    lightGray: '#f8f9fa',
    gray: '#e0e0e0',
    darkGray: '#666666',
    black: '#333333',
  };

  const formatCurrency = (value: number | undefined) => {
    const numValue = value || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numValue);
  };

  // Safe check for details array
 

  return (
    <View style={[styles.container, { backgroundColor: colors.lightGray }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.white }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.black }]}>{produk.nama || 'Nama Produk'}</Text>
            <Text style={[styles.barcode, { color: colors.darkGray }]}>#{produk.barcode || 'N/A'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Informasi Produk</Text>
            
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="shopping-cart" size={18} color={colors.darkGray} />
                <Text style={[styles.infoLabel, { color: colors.darkGray }]}>Harga Beli</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.black }]}>{formatCurrency(produk.harga_beli)}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="sell" size={18} color={colors.darkGray} />
                <Text style={[styles.infoLabel, { color: colors.darkGray }]}>Harga Jual 1</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.primary }]}>{formatCurrency(produk.harga_jual1)}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="sell" size={18} color={colors.darkGray} />
                <Text style={[styles.infoLabel, { color: colors.darkGray }]}>Harga Jual 2</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.primary }]}>{formatCurrency(produk.harga_jual2)}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="sell" size={18} color={colors.darkGray} />
                <Text style={[styles.infoLabel, { color: colors.darkGray }]}>Harga Jual 3</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.primary }]}>{formatCurrency(produk.harga_jual3)}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="sell" size={18} color={colors.darkGray} />
                <Text style={[styles.infoLabel, { color: colors.darkGray }]}>Harga Jual 4</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.primary }]}>{formatCurrency(produk.harga_jual4)}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="inventory" size={18} color={colors.darkGray} />
                <Text style={[styles.infoLabel, { color: colors.darkGray }]}>Stok</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.black }]}>{produk.stok || 0}</Text>
            </View>
          </View>
        </View>

       
      </ScrollView>

      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: colors.primary }]}
        onPress={() => (nav as any).goBack()}
      >
        <Ionicons name="arrow-back" size={20} color={colors.white} />
        <Text style={[styles.backButtonText, { color: colors.white }]}>Kembali</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  barcode: {
    fontSize: 16,
    opacity: 0.8,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  historyItem: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  historyType: {
    fontWeight: '600',
    fontSize: 15,
  },
  historyDate: {
    fontSize: 13,
  },
  historyBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyQty: {
    fontSize: 14,
  },
  historyMember: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});