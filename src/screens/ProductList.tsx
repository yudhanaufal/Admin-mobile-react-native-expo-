import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput,
  RefreshControl,
  SafeAreaView
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as XLSX from "xlsx";
import { produkService } from "../services/produkService";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useNetwork } from "../hooks/useNetwork";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Produk } from "../models/Produk";

// Constants for colors
const COLORS = {
  primary: '#4a6da7',
  secondary: '#6c757d',
  danger: '#dc3545',
  warning: '#ffc107',
  white: '#ffffff',
  lightGray: '#f8f9fa',
  gray: '#e0e0e0',
  darkGray: '#666666',
  black: '#333333',
};

export default function ProductList() {
  // State management
  const [list, setList] = useState<Produk[]>([]);
  const [filteredList, setFilteredList] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  // Hooks
  const isFocused = useIsFocused();
  const nav = useNavigation();
  const { isConnected } = useNetwork();

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const tokoId = await AsyncStorage.getItem("@pos:selectedTokoId");
      if (!tokoId) {
        nav.navigate("PilihToko" as never);
        return;
      }
      
      const data = await produkService.getAll(tokoId);
      setList(data);
      setFilteredList(data);
    } catch (error) {
      console.error("Failed to load products:", error);
      Alert.alert("Error", "Gagal memuat daftar produk");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [nav]);

  // Setup realtime listener
  useEffect(() => {
    let unsubscribe = () => {};

    const setupRealtimeListener = async () => {
      try {
        const tokoId = await AsyncStorage.getItem("@pos:selectedTokoId");
        if (!tokoId) return;

        unsubscribe = await produkService.listenToProduk(tokoId, (produkList) => {
          setList(produkList);
          setFilteredList(produkList);
        });
      } catch (error) {
        console.error("Error setting up realtime listener:", error);
      }
    };

    if (isConnected) {
      setupRealtimeListener();
    } else {
      // Fallback to regular load if offline
      loadProducts();
    }

    return () => unsubscribe();
  }, [isConnected, loadProducts]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter products
  useEffect(() => {
    if (debouncedQuery.trim() === "") {
      setFilteredList(list);
    } else {
      const filtered = list.filter(product => 
        product.nama.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        (product.barcode && product.barcode.toLowerCase().includes(debouncedQuery.toLowerCase()))
      );
      setFilteredList(filtered);
    }
  }, [debouncedQuery, list]);

  // Refresh control
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts();
  }, [loadProducts]);

  // Edit product
  const onEdit = useCallback((produk: Produk) => {
    (nav as any).navigate("ProductForm", { produk });
  }, [nav]);

  // Delete product
  const onDelete = useCallback(async (id: string) => {
    Alert.alert("Hapus Produk", "Yakin ingin menghapus?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            const tokoId = await AsyncStorage.getItem("@pos:selectedTokoId");
            if (tokoId) {
              await produkService.remove(tokoId, id);
              Alert.alert("Sukses", "Produk berhasil dihapus");
            }
          } catch (error) {
            Alert.alert("Error", "Gagal menghapus produk");
          }
        }
      }
    ]);
  }, []);

  // Import Excel
  const importExcel = useCallback(async () => {
    try {
      setImporting(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel"
        ],
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        setImporting(false);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        
        // Baca file Excel langsung dari URI
        const workbook = XLSX.read(await (await fetch(fileUri)).arrayBuffer(), {
          type: 'array',
          cellText: false,
          cellDates: true,
        });
        
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        
        // Konversi ke JSON
        const jsonData: any[] = XLSX.utils.sheet_to_json(ws);

        const tokoId = await AsyncStorage.getItem("@pos:selectedTokoId");
        if (!tokoId) {
          Alert.alert("Error", "Toko belum dipilih, import dibatalkan.");
          setImporting(false);
          return;
        }

        // Process data untuk import
        const productsToImport = jsonData
          .filter(row => row.Nama || row.nama) // Hanya baris dengan nama produk
          .map(row => {
            // Fungsi helper untuk parsing angka dengan aman
            const parseNumber = (value: any, defaultValue = 0) => {
              if (value === null || value === undefined) return defaultValue;
              if (typeof value === 'number') return value;
              if (typeof value === 'string') {
                // Hapus karakter non-numeric kecuali titik dan koma
                const cleaned = value.toString().replace(/[^\d.,]/g, '');
                // Ganti koma dengan titik untuk parsing float
                const normalized = cleaned.replace(',', '.');
                const parsed = parseFloat(normalized);
                return isNaN(parsed) ? defaultValue : parsed;
              }
              return defaultValue;
            };

            // Ambil nilai dari berbagai kemungkinan nama field
            const nama = row.Nama || row.nama || row['Nama Produk'] || '';
            const barcode = row.Barcode || row.barcode || row.Kode || '';
            const harga_beli = parseNumber(row.Harga_Beli || row.harga_beli || row['Harga Beli'], 0);
            const harga_jual1 = parseNumber(row.Harga_Jual1 || row.harga_jual1 || row['Harga Jual 1'], 0);
            const harga_jual2 = parseNumber(row.Harga_Jual2 || row.harga_jual2 || row['Harga Jual 2'], 0);
            const harga_jual3 = parseNumber(row.Harga_Jual3 || row.harga_jual3 || row['Harga Jual 3'], 0);
            const harga_jual4 = parseNumber(row.Harga_Jual4 || row.harga_jual4 || row['Harga Jual 4'], 0);
            const stok = parseInt(String(parseNumber(row.Stok || row.stok || row.Stock, 0)), 10);
            const kategori = row.Kategori || row.kategori || row['Kategori'] || '';

            return {
              nama: String(nama).trim(),
              barcode: String(barcode).trim(),
              harga_beli: harga_beli,
              harga_jual1: harga_jual1,
              harga_jual2: harga_jual2,
              harga_jual3: harga_jual3,
              harga_jual4: harga_jual4,
              stok: stok,
              kategori: String(kategori).trim()
            };
          });

        if (productsToImport.length === 0) {
          Alert.alert("Peringatan", "Tidak ada data yang valid untuk diimport");
          setImporting(false);
          return;
        }

        // Gunakan batch create
        await produkService.batchCreate(tokoId, productsToImport);
        Alert.alert("Sukses", `Berhasil mengimpor ${productsToImport.length} produk`);
      }
    } catch (err) {
      console.error("Import error", err);
      Alert.alert("Error", "Gagal import file: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setImporting(false);
    }
  }, []);

  // Format currency
  const formatCurrency = (value: number | undefined) => {
    const numValue = value || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numValue);
  };

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setDebouncedQuery("");
  }, []);

  // Render product item
  const renderProductItem = useCallback(({ item }: { item: Produk }) => (
    <View style={[
      styles.card, 
      { 
        backgroundColor: COLORS.white,
        shadowColor: COLORS.black,
      }
    ]}>
      <View style={[styles.cardHeader, { borderBottomColor: COLORS.gray }]}>
        <Text style={[styles.productName, { color: COLORS.black }]}>{item.nama || 'N/A'}</Text>
        <Text style={[
          styles.barcode, 
          { 
            color: COLORS.darkGray,
            backgroundColor: COLORS.lightGray,
          }
        ]}>
          #{item.barcode || 'N/A'}
        </Text>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: COLORS.darkGray }]}>Stok:</Text>
          <Text style={[styles.infoValue, { color: COLORS.black }]}>{item.stok || 0}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: COLORS.darkGray }]}>Harga Jual 1:</Text>
          <Text style={[styles.priceValue, { color: COLORS.primary }]}>
            {formatCurrency(item.harga_jual1)}
          </Text>
        </View>
      </View>
      
      <View style={[styles.cardFooter, { borderTopColor: COLORS.gray }]}>
        <TouchableOpacity 
          style={[
            styles.detailButton, 
            { 
              borderColor: COLORS.primary,
            }
          ]}
          onPress={() => (nav as any).navigate("ProductDetail", { produk: item })}
        >
          <MaterialIcons name="info" size={18} color={COLORS.primary} />
          <Text style={[styles.detailButtonText, { color: COLORS.primary }]}>Detail</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onEdit(item)}
        >
          <MaterialIcons name="edit" size={18} color={COLORS.warning} />
          <Text style={[styles.actionButtonText, { color: COLORS.warning }]}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onDelete(item.id)}
        >
          <MaterialIcons name="delete" size={18} color={COLORS.danger} />
          <Text style={[styles.actionButtonText, { color: COLORS.danger }]}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [onDelete, onEdit, nav]);

  // Render empty state
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={60} color={COLORS.gray} />
      <Text style={[styles.emptyText, { color: COLORS.darkGray }]}>
        {searchQuery ? "Produk tidak ditemukan" : "Belum ada produk"}
      </Text>
      <Text style={[styles.emptySubtext, { color: COLORS.darkGray }]}>
        {searchQuery ? "Coba kata kunci lain" : "Tambahkan produk baru atau import dari Excel"}
      </Text>
      {searchQuery && (
        <TouchableOpacity 
          style={[styles.clearSearchButton, { borderColor: COLORS.primary }]}
          onPress={clearSearch}
        >
          <Text style={[styles.clearSearchText, { color: COLORS.primary }]}>
            Reset Pencarian
          </Text>
        </TouchableOpacity>
      )}
    </View>
  ), [searchQuery, clearSearch]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.lightGray }]}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: COLORS.white,
        borderBottomColor: COLORS.gray,
        shadowColor: COLORS.black,
      }]}>
        <Text style={[styles.title, { color: COLORS.black }]}>Daftar Produk</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.importButton, { backgroundColor: COLORS.secondary }]}
            onPress={importExcel}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="document-attach" size={18} color={COLORS.white} />
                <Text style={[styles.buttonText, { color: COLORS.white }]}>Import</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: COLORS.primary }]}
            onPress={() => (nav as any).navigate("ProductForm", { produk: null })}
          >
            <Ionicons name="add" size={20} color={COLORS.white} />
            <Text style={[styles.buttonText, { color: COLORS.white }]}>Tambah</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: COLORS.white }]}>
        <Ionicons name="search" size={20} color={COLORS.darkGray} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: COLORS.black }]}
          placeholder="Cari produk..."
          placeholderTextColor={COLORS.darkGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Product List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: COLORS.darkGray }]}>Memuat produk...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          renderItem={renderProductItem}
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { 
    fontSize: 22, 
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  barcode: {
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
  },
  clearSearchButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: '500',
  },
});