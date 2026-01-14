import React, { useState, useEffect } from "react";
import { 
  View, 
  TextInput, 
  Button, 
  StyleSheet, 
  ScrollView, 
  Text, 
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRoute, RouteProp } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { produkService } from "../services/produkService";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Produk } from '../services/produkService'; // Pastikan Anda mengimpor tipe Produk


type ProdukFormRouteParams = {
  produk?: Produk;
};

type RootStackParamList = {
  ProductForm: ProdukFormRouteParams;
};

export default function ProdukForm({ navigation }: any) {

  const route = useRoute<RouteProp<RootStackParamList, 'ProductForm'>>();
  const produkToEdit = route.params?.produk;
// -----------------------

  // Tentukan apakah ini mode "Edit" atau "Tambah"
  const isEditing = !!produkToEdit;

  // State untuk form, diinisialisasi dengan nilai default atau dari produkToEdit
  const [nama, setNama] = useState(isEditing ? produkToEdit.nama : "");
  const [barcode, setBarcode] = useState(isEditing ? produkToEdit.barcode : "");
  const [kategori, setKategori] = useState(isEditing ? produkToEdit.kategori : "");
  const [hargaBeli, setHargaBeli] = useState(isEditing ? String(produkToEdit.harga_beli) : "");
  const [hargaJual1, setHargaJual1] = useState(isEditing ? String(produkToEdit.harga_jual1) : "");
  const [hargaJual2, setHargaJual2] = useState(isEditing ? String(produkToEdit.harga_jual2) : "");
  const [hargaJual3, setHargaJual3] = useState(isEditing ? String(produkToEdit.harga_jual3) : "");
  const [hargaJual4, setHargaJual4] = useState(isEditing ? String(produkToEdit.harga_jual4) : "");
  const [stok, setStok] = useState(isEditing ? String(produkToEdit.stok) : "");
  const [isLoading, setIsLoading] = useState(false);

  async function save() {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const tokoId = await AsyncStorage.getItem("@pos:selectedTokoId");
      if (!tokoId) return;

      const newProductData = {
        nama,
        barcode,
        kategori,
        harga_beli: Number(hargaBeli),
        harga_jual1: Number(hargaJual1),
        harga_jual2: Number(hargaJual2),
        harga_jual3: Number(hargaJual3),
        harga_jual4: Number(hargaJual4),
        stok: Number(stok),
        details: [],
      };

      if (isEditing && produkToEdit) {
        await produkService.update(tokoId, produkToEdit.id, newProductData);
        Alert.alert('Sukses', 'Produk berhasil diperbarui.');
      } else {
        await produkService.create(tokoId, newProductData);
        Alert.alert('Sukses', 'Produk berhasil ditambahkan.');
      }

      navigation.goBack();
    } catch (error) {
      console.error("Error saving product:", error);
      Alert.alert("Gagal", `Terjadi kesalahan saat menyimpan produk: ${String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>{isEditing ? "Edit Produk" : "Tambah Produk Baru"}</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nama Produk</Text>
          <TextInput 
            placeholder="Masukkan nama produk" 
            value={nama} 
            onChangeText={setNama} 
            style={styles.input} 
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Kategori</Text>
          <TextInput
            placeholder="Masukkan kategori produk"
            value={kategori}
            onChangeText={setKategori}
            style={styles.input}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Barcode</Text>
          <TextInput 
            placeholder="Masukkan barcode" 
            value={barcode} 
            onChangeText={setBarcode} 
            style={styles.input} 
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Harga Beli</Text>
          <TextInput 
            placeholder="Masukkan harga beli" 
            value={hargaBeli} 
            onChangeText={setHargaBeli} 
            style={styles.input} 
            keyboardType="numeric" 
          />
        </View>

        <View style={styles.priceRow}>
          <View style={[styles.formGroup, styles.priceInput]}>
            <Text style={styles.label}>Harga Jual 1</Text>
            <TextInput 
              placeholder="Harga 1" 
              value={hargaJual1} 
              onChangeText={setHargaJual1} 
              style={styles.input} 
              keyboardType="numeric" 
            />
          </View>
          <View style={[styles.formGroup, styles.priceInput]}>
            <Text style={styles.label}>Harga Jual 2</Text>
            <TextInput 
              placeholder="Harga 2" 
              value={hargaJual2} 
              onChangeText={setHargaJual2} 
              style={styles.input} 
              keyboardType="numeric" 
            />
          </View>
        </View>

        <View style={styles.priceRow}>
          <View style={[styles.formGroup, styles.priceInput]}>
            <Text style={styles.label}>Harga Jual 3</Text>
            <TextInput 
              placeholder="Harga 3" 
              value={hargaJual3} 
              onChangeText={setHargaJual3} 
              style={styles.input} 
              keyboardType="numeric" 
            />
          </View>
          <View style={[styles.formGroup, styles.priceInput]}>
            <Text style={styles.label}>Harga Jual 4</Text>
            <TextInput 
              placeholder="Harga 4" 
              value={hargaJual4} 
              onChangeText={setHargaJual4} 
              style={styles.input} 
              keyboardType="numeric" 
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Stok</Text>
          <TextInput 
            placeholder="Masukkan jumlah stok" 
            value={stok} 
            onChangeText={setStok} 
            style={styles.input} 
            keyboardType="numeric" 
          />
        </View>

        <TouchableOpacity 
          onPress={save} 
          style={styles.saveButton}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? "Menyimpan..." : (isEditing ? "Perbarui Produk" : "Simpan Produk")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  priceInput: {
    width: '48%',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});