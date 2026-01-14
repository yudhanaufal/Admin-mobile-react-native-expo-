import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../firebase/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDoc,
} from "firebase/firestore";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigation";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

type DetailRouteProp = RouteProp<RootStackParamList, "PembelianDetail">;
type NavProp = NativeStackNavigationProp<RootStackParamList, "PembelianDetail">;

interface Item {
  id: string;
  nama: string;
  harga: number;
  jumlah_dipesan: number;
  harga_beli?: number | null;
  jumlah_diretur?: number | null;
  jumlah_ditambah?: number | null;
  jumlah_diterima?: number | null;
  subtotal_retur?: number | null;
  subtotal_tambah?: number | null;
}

interface Pembelian {
  id: string;
  invoice: string;
  status: string;
  tanggal: string;
  total_pembelian: number;
  total_retur?: number | null;
  total_tambah?: number | null;
}

const { width } = Dimensions.get('window');

export default function PembelianDetailScreen() {
  const route = useRoute<DetailRouteProp>();
  const navigation = useNavigation<NavProp>();
  const { pembelianId } = route.params;

  const [items, setItems] = useState<Item[]>([]);
  const [pembelian, setPembelian] = useState<Pembelian | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [produkList, setProdukList] = useState<Item[]>([]);
  const [selectedProduk, setSelectedProduk] = useState<Item | null>(null);
  const [newHarga, setNewHarga] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");

  // Fungsi untuk mengecek apakah jumlah diterima berbeda dengan dipesan
  const isQuantityMismatch = useCallback((item: Item): boolean => {
    return item.jumlah_diterima !== null && 
           item.jumlah_diterima !== undefined &&
           item.jumlah_dipesan !== null && 
           item.jumlah_dipesan !== undefined && 
           item.jumlah_diterima !== item.jumlah_dipesan;
  }, []);

  // load pembelian dan items
  useEffect(() => {
    const loadData = async () => {
      try {
        const storeId = await AsyncStorage.getItem("@pos:selectedTokoId");
        if (!storeId) return;

        // Load data pembelian
        const pembelianRef = doc(db, `stores/${storeId}/pembelian/${pembelianId}`);
        const pembelianSnap = await getDoc(pembelianRef);
        if (pembelianSnap.exists()) {
          const data = pembelianSnap.data();
          
          // Convert Firestore timestamp to string
          let tanggalString = "";
          if (data.tanggal) {
            if (data.tanggal.seconds) {
              // Firestore Timestamp
              const date = new Date(data.tanggal.seconds * 1000);
              tanggalString = date.toLocaleString("id-ID");
            } else if (typeof data.tanggal === 'string') {
              // Already string
              tanggalString = data.tanggal;
            }
          }

          setPembelian({
            id: pembelianSnap.id,
            invoice: data.invoice || "",
            status: data.status || "",
            tanggal: tanggalString,
            total_pembelian: data.total_pembelian || 0,
            total_retur: data.total_retur || null,
            total_tambah: data.total_tambah || null,
          });
        }

        // Load items
        const itemsSnap = await getDocs(collection(db, `stores/${storeId}/pembelian/${pembelianId}/items`));
        const itemsList: Item[] = itemsSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            nama: data.nama || "",
            harga: data.harga || 0,
            jumlah_dipesan: data.jumlah_dipesan || 0,
            harga_beli: data.harga_beli ?? null,
            jumlah_diretur: data.jumlah_diretur ?? null,
            jumlah_ditambah: data.jumlah_ditambah ?? null,
            jumlah_diterima: data.jumlah_diterima ?? null,
            subtotal_retur: data.subtotal_retur ?? null,
            subtotal_tambah: data.subtotal_tambah ?? null,
          };
        });
        setItems(itemsList);
      } catch (e) {
        console.error("🔥 Error load data:", e);
        Alert.alert("Error", "Gagal memuat data pembelian");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [pembelianId]);

  // load produk master untuk tambah
  const loadProdukList = async () => {
    try {
      const storeId = await AsyncStorage.getItem("@pos:selectedTokoId");
      if (!storeId) return;
      const snap = await getDocs(collection(db, `stores/${storeId}/produks`));
      const list: Item[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          nama: data.nama,
          harga: data.harga_beli || 0,
          jumlah_dipesan: 0,
        };
      });
      setProdukList(list);
    } catch (e) {
      console.error("🔥 Error load produk:", e);
      Alert.alert("Error", "Gagal memuat daftar produk");
    }
  };

  // fungsi update qty atau harga
  const updateItem = async (itemId: string, field: "jumlah_dipesan" | "harga", value: number) => {
    try {
      const storeId = await AsyncStorage.getItem("@pos:selectedTokoId");
      if (!storeId) return;

      const itemRef = doc(
        db,
        `stores/${storeId}/pembelian/${pembelianId}/items/${itemId}`
      );

      await updateDoc(itemRef, { [field]: value });

      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId ? { ...it, [field]: value } : it
        )
      );

      // hitung total baru
      const newItems = items.map((it) =>
        it.id === itemId ? { ...it, [field]: value } : it
      );
      const newTotal = newItems.reduce(
        (sum, it) => sum + it.harga * it.jumlah_dipesan,
        0
      );

      const pembelianRef = doc(db, `stores/${storeId}/pembelian/${pembelianId}`);
      await updateDoc(pembelianRef, { total_pembelian: newTotal });
      
      Alert.alert("Sukses", "Item berhasil diperbarui");
    } catch (e) {
      console.error("🔥 Error update item:", e);
      Alert.alert("Error", "Gagal memperbarui item");
    }
  };

  // Fungsi untuk update field nullable
  const updateNullableField = async (
    itemId: string, 
    field: "jumlah_diretur" | "jumlah_ditambah" | "jumlah_diterima" | "harga_beli",
    value: number | null
  ) => {
    try {
      const storeId = await AsyncStorage.getItem("@pos:selectedTokoId");
      if (!storeId) return;

      const itemRef = doc(
        db,
        `stores/${storeId}/pembelian/${pembelianId}/items/${itemId}`
      );

      // Dapatkan item yang sedang diupdate
      const currentItem = items.find(item => item.id === itemId);
      if (!currentItem) return;

      let updates: any = { [field]: value };

      // Jika yang diupdate adalah jumlah_diretur, hitung subtotal_retur
      if (field === "jumlah_diretur") {
        const hargaBeli = currentItem.harga || 0;
        const subtotalRetur = value !== null ? value * hargaBeli : null;
        updates.subtotal_retur = subtotalRetur;
      }

      // Jika yang diupdate adalah jumlah_ditambah, hitung subtotal_tambah
      if (field === "jumlah_ditambah") {
        const hargaBeli = currentItem.harga || 0;
        const subtotalTambah = value !== null ? value * hargaBeli : null;
        updates.subtotal_tambah = subtotalTambah;
      }

      // Jika yang diupdate adalah harga_beli, hitung ulang subtotal_retur dan subtotal_tambah
      if (field === "harga_beli") {
        updates[field] = currentItem.harga; // Always take harga from item
      }

      await updateDoc(itemRef, updates);

      // Update state lokal dan total retur
      setItems((prev) => {
        const newItems = prev.map((it) =>
          it.id === itemId ? { ...it, ...updates } : it
        );
        // Hitung total retur dan total tambah dari seluruh items terbaru
        const totalRetur = newItems.reduce((sum: number, it: Item) => sum + (it.subtotal_retur || 0), 0);
        const totalTambah = newItems.reduce((sum: number, it: Item) => sum + (it.subtotal_tambah || 0), 0);
        // Update Firestore total_retur dan total_tambah
        const pembelianRef = doc(db, `stores/${storeId}/pembelian/${pembelianId}`);
        updateDoc(pembelianRef, { total_retur: totalRetur, total_tambah: totalTambah });
        setPembelian(prev => prev ? { ...prev, total_retur: totalRetur, total_tambah: totalTambah } : null);
        return newItems;
      });
      Alert.alert("Sukses", "Field berhasil diperbarui");
    } catch (e) {
      console.error("🔥 Error update field:", e);
      Alert.alert("Error", "Gagal memperbarui field");
    }
  };

  // Fungsi untuk update total retur dan total tambah di dokumen utama
  const updatePembelianTotals = async (field: "total_retur" | "total_tambah", value: number | null) => {
    try {
      const storeId = await AsyncStorage.getItem("@pos:selectedTokoId");
      if (!storeId) return;

      const pembelianRef = doc(db, `stores/${storeId}/pembelian/${pembelianId}`);
      await updateDoc(pembelianRef, { [field]: value });
      
      setPembelian(prev => prev ? { ...prev, [field]: value } : null);
      
      Alert.alert("Sukses", "Total berhasil diperbarui");
    } catch (e) {
      console.error("🔥 Error update totals:", e);
      Alert.alert("Error", "Gagal memperbarui total");
    }
  };

  // hapus item
  const deleteItem = async (itemId: string) => {
    try {
      const storeId = await AsyncStorage.getItem("@pos:selectedTokoId");
      if (!storeId) return;

      Alert.alert(
        "Konfirmasi",
        "Apakah Anda yakin ingin menghapus item ini?",
        [
          {
            text: "Batal",
            style: "cancel"
          },
          {
            text: "Hapus",
            onPress: async () => {
              const itemRef = doc(
                db,
                `stores/${storeId}/pembelian/${pembelianId}/items/${itemId}`
              );
              await deleteDoc(itemRef);
              
              setItems((prev) => prev.filter((it) => it.id !== itemId));
              
              // hitung total baru
              const newItems = items.filter((it) => it.id !== itemId);
              const newTotal = newItems.reduce(
                (sum, it) => sum + it.harga * it.jumlah_dipesan,
                0
              );
              
              const pembelianRef = doc(db, `stores/${storeId}/pembelian/${pembelianId}`);
              await updateDoc(pembelianRef, { total_pembelian: newTotal });
              
              Alert.alert("Sukses", "Item berhasil dihapus");
            }
          }
        ]
      );
    } catch (e) {
      console.error("🔥 Error delete item:", e);
      Alert.alert("Error", "Gagal menghapus item");
    }
  };

  // tambah produk baru
  const tambahProduk = async () => {
    if (!selectedProduk) {
      Alert.alert("Error", "Pilih produk terlebih dahulu");
      return;
    }
    try {
      const storeId = await AsyncStorage.getItem("@pos:selectedTokoId");
      if (!storeId) return;

      const hargaNum = newHarga ? parseInt(newHarga) : null;
      const qtyNum = parseInt(newQty) || 1;
      
      if (qtyNum <= 0) {
        Alert.alert("Error", "Jumlah harus lebih dari 0");
        return;
      }

      const itemRef = collection(
        db,
        `stores/${storeId}/pembelian/${pembelianId}/items`
      );

      const docRef = await addDoc(itemRef, {
        nama: selectedProduk.nama,
        harga: selectedProduk.harga,
        jumlah_dipesan: qtyNum,
        harga_beli: hargaNum,
        jumlah_diretur: null,
        jumlah_ditambah: null,
        jumlah_diterima: null,
        subtotal_retur: null,
        subtotal_tambah: null,
      });

      const newItem: Item = {
        id: docRef.id,
        nama: selectedProduk.nama,
        harga: selectedProduk.harga,
        jumlah_dipesan: qtyNum,
        harga_beli: hargaNum,
        jumlah_diretur: null,
        jumlah_ditambah: null,
        jumlah_diterima: null,
        subtotal_retur: null,
        subtotal_tambah: null,
      };
      const newItems = [...items, newItem];
      setItems(newItems);

      // hitung total baru
      const newTotal = newItems.reduce(
        (sum, it) => sum + it.harga * it.jumlah_dipesan,
        0
      );
      const pembelianRef = doc(db, `stores/${storeId}/pembelian/${pembelianId}`);
      await updateDoc(pembelianRef, { total_pembelian: newTotal });

      setModalVisible(false);
      setSelectedProduk(null);
      setNewHarga("");
      setNewQty("1");
      setSearchQuery("");
      
      Alert.alert("Sukses", "Produk berhasil ditambahkan");
    } catch (e) {
      console.error("🔥 Error tambah produk:", e);
      Alert.alert("Error", "Gagal menambahkan produk");
    }
  };

  // Filter produk berdasarkan pencarian
  const filteredProdukList = produkList.filter((p) =>
    p.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Memuat detail pembelian...</Text>
      </View>
    );
  }

  const total = items.reduce(
    (sum, it) => sum + it.harga * it.jumlah_dipesan,
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Header Info */}
            {pembelian && (
              <View style={styles.headerInfo}>
                <Text style={styles.invoiceText}>Invoice: {pembelian.invoice}</Text>
                <Text style={styles.statusText}>Status: {pembelian.status}</Text>
                <Text style={styles.dateText}>Tanggal: {pembelian.tanggal}</Text>
              </View>
            )}

            {/* Daftar Item */}
            {items.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="remove-shopping-cart" size={64} color="#CBD5E1" />
                <Text style={styles.emptyText}>Belum ada item</Text>
                <Text style={styles.emptySubtext}>
                  Tambahkan produk dengan menekan tombol di bawah
                </Text>
              </View>
            ) : (
              <View style={styles.itemsContainer}>
                {items.map((item) => {
                  const hasMismatch = isQuantityMismatch(item);
                  return (
                    <View key={item.id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.itemName} numberOfLines={2}>{item.nama}</Text>
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => deleteItem(item.id)}
                        >
                          <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.inputRow}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Harga Beli</Text>
                          <View style={styles.priceInputContainer}>
                            <Text style={styles.currency}>Rp</Text>
                            <Text style={styles.priceInput}>{item.harga.toLocaleString("id-ID")}</Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.quantityContainer}>
                        <View style={styles.quantityRow}>
                          <View style={styles.quantityItem}>
                            <Text style={styles.inputLabel}>Jumlah Dipesan</Text>
                            <View style={styles.quantityControls}>
                              <Text style={[
                                styles.nullableInput,
                                hasMismatch && styles.warningText
                              ]}>
                                {item.jumlah_dipesan.toString() || ""}
                              </Text>
                            </View>
                          </View>
                          
                          <View style={styles.quantityItem}>
                            <Text style={styles.inputLabel}>Jumlah Diterima</Text>
                            <View style={[
                              styles.quantityControls,
                              hasMismatch && styles.warningContainer
                            ]}>
                              <Text style={[
                                styles.nullableInput,
                                hasMismatch && styles.warningText
                              ]}>
                                {item.jumlah_diterima != null ? item.jumlah_diterima.toString() : ""}
                              </Text>
                              {hasMismatch && (
                                <Ionicons 
                                  name="warning" 
                                  size={16} 
                                  color="#EF4444" 
                                  style={styles.warningIcon}
                                />
                              )}
                            </View>
                            {hasMismatch && (
                              <Text style={styles.warningMessage}>
                                Selisih: {Math.abs(item.jumlah_dipesan - (item.jumlah_diterima || 0))}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* Nullable Fields */}
                      <View style={styles.nullableFieldsContainer}>
                        <Text style={styles.nullableSectionTitle}>Data Tambahan</Text>
                        
                        <View style={styles.nullableRow}>
                          <View style={styles.nullableField}>
                            <Text style={styles.inputLabel}>Jumlah Diretur</Text>
                            <View style={styles.nullableInputContainer}>
                              <TextInput
                                style={styles.nullableInput}
                                value={item.jumlah_diretur?.toString() || ""}
                                placeholder="0"
                                keyboardType="numeric"
                                onChangeText={(val) => updateNullableField(
                                  item.id, 
                                  "jumlah_diretur", 
                                  val ? parseInt(val) : null
                                )}
                              />
                              <TouchableOpacity
                                style={styles.nullButton}
                                onPress={() => updateNullableField(item.id, "jumlah_diretur", null)}
                              >
                                <Text style={styles.nullButtonText}>Null</Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          <View style={styles.nullableField}>
                            <Text style={styles.inputLabel}>Jumlah Ditambah</Text>
                            <View style={styles.nullableInputContainer}>
                              <TextInput
                                style={styles.nullableInput}
                                value={item.jumlah_ditambah?.toString() || ""}
                                placeholder="0"
                                keyboardType="numeric"
                                onChangeText={(val) => updateNullableField(
                                  item.id, 
                                  "jumlah_ditambah", 
                                  val ? parseInt(val) : null
                                )}
                              />
                              <TouchableOpacity
                                style={styles.nullButton}
                                onPress={() => updateNullableField(item.id, "jumlah_ditambah", null)}
                              >
                                <Text style={styles.nullButtonText}>Null</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>

                        <View style={styles.nullableRow}>
                          <View style={styles.nullableField}>
                            <Text style={styles.inputLabel}>Subtotal Retur</Text>
                            <View style={[styles.nullableInputContainer, styles.disabledInput]}>
                              <Text style={styles.currency}>Rp</Text>
                              <Text style={styles.nullableInput}>
                                {item.subtotal_retur?.toLocaleString("id-ID") || "0"}
                              </Text>
                              <Text style={styles.autoText}>Auto</Text>
                            </View>
                            <Text style={styles.calculationText}>
                              {item.jumlah_diretur !== null && item.harga_beli !== null 
                                ? `${item.jumlah_diretur} × ${(item.harga_beli ?? 0).toLocaleString("id-ID")}`
                                : "0 × 0"}
                            </Text>
                          </View>

                          <View style={styles.nullableField}>
                            <Text style={styles.inputLabel}>Subtotal Tambah</Text>
                            <View style={[styles.nullableInputContainer, styles.disabledInput]}>
                              <Text style={styles.currency}>Rp</Text>
                              <Text style={styles.nullableInput}>
                                {item.subtotal_tambah?.toLocaleString("id-ID") || "0"}
                              </Text>
                              <Text style={styles.autoText}>Auto</Text>
                            </View>
                            <Text style={styles.calculationText}>
                              {item.jumlah_ditambah !== null && item.harga_beli !== null 
                                ? `${item.jumlah_ditambah} × ${(item.harga_beli ?? 0).toLocaleString("id-ID")}`
                                : "0 × 0"}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.subtotalContainer}>
                        <Text style={styles.subtotalLabel}>Subtotal Pembelian</Text>
                        <Text style={styles.subtotal}>
                          Rp {(item.harga * item.jumlah_dipesan).toLocaleString("id-ID")}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
            
            {/* Total Pembelian */}
            {items.length > 0 && (
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total Pembelian</Text>
                <Text style={styles.totalAmount}>
                  Rp {total.toLocaleString("id-ID")}
                </Text>
              </View>
            )}

            {/* Total Retur dan Total Tambah */}
            <View style={styles.additionalTotalsContainer}>
              <View style={styles.additionalTotal}>
                <Text style={styles.additionalTotalLabel}>Total Retur</Text>
                <View style={styles.additionalTotalInputContainer}>
                  <Text style={styles.currency}>Rp</Text>
                  <Text style={styles.nullableInput}>
                    {pembelian?.total_retur?.toString() || ""}
                  </Text>
                </View>
              </View>
              
              <View style={styles.additionalTotal}>
                <Text style={styles.additionalTotalLabel}>Total Tambah</Text>
                <View style={styles.additionalTotalInputContainer}>
                  <Text style={styles.currency}>Rp</Text>
                  <Text style={styles.nullableInput}>
                    {pembelian?.total_tambah?.toString() || ""}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
        
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.saveText}>Simpan Perubahan</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

{/* Modal tambah produk */}
<Modal visible={modalVisible} animationType="slide" transparent={true}>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Tambah Produk</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => {
            setModalVisible(false);
            setSelectedProduk(null);
            setSearchQuery("");
          }}
        >
          <Ionicons name="close" size={24} color="#64748B" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari produk..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <FlatList
        data={filteredProdukList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.modalList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.modalItem,
              selectedProduk?.id === item.id && styles.modalItemSelected,
            ]}
            onPress={() => setSelectedProduk(item)}
          >
            <View style={styles.modalItemInfo}>
              <Text style={styles.modalItemName}>{item.nama}</Text>
              <Text style={styles.modalItemPrice}>
                Harga Beli: Rp {item.harga.toLocaleString("id-ID")}
              </Text>
            </View>
            {selectedProduk?.id === item.id && (
              <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.modalEmpty}>
            <Text style={styles.modalEmptyText}>Tidak ada produk ditemukan</Text>
          </View>
        }
      />
      
      {selectedProduk && (
        <View style={styles.modalForm}>
          <View style={styles.modalInputGroup}>
            <Text style={styles.modalInputLabel}>Harga Beli (opsional)</Text>
            <View style={styles.modalPriceInput}>
              <Text style={styles.currency}>Rp</Text>
              <TextInput
                style={[styles.modalInput, {color: '#1E293B'}]}
                placeholder={selectedProduk.harga.toString()}
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={newHarga}
                onChangeText={setNewHarga}
              />
            </View>
          </View>
          
          <View style={styles.modalInputGroup}>
            <Text style={styles.modalInputLabel}>Jumlah</Text>
            <TextInput
              style={[styles.modalInput, {color: '#1E293B'}]}
              placeholder="1"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={newQty}
              onChangeText={setNewQty}
            />
          </View>
        </View>
      )}
      
      <View style={styles.modalActions}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.modalCancelButton]}
          onPress={() => {
            setModalVisible(false);
            setSelectedProduk(null);
            setSearchQuery("");
          }}
        >
          <Text style={styles.modalCancelText}>Batal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.modalButton, styles.modalConfirmButton, !selectedProduk && styles.disabledButton]}
          onPress={tambahProduk}
          disabled={!selectedProduk}
        >
          <Text style={styles.modalConfirmText}>Tambah</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  disabledInput: {
    backgroundColor: "#E5E7EB",
  },
  disabledButton: {
  opacity: 0.5,
  backgroundColor: '#9CA3AF', // atau warna abu-abu lainnya
},
  autoText: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "600",
    marginHorizontal: 8,
    fontStyle: "italic",
  },
  calculationText: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
    textAlign: "center",
  },
  headerInfo: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  invoiceText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: "#64748B",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 4,
    textAlign: "center",
  },
  itemsContainer: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "500",
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F8FAFC",
  }, 
modalInput: {
  flex: 1,
  borderWidth: 1,
  borderColor: '#E2E8F0',
  borderRadius: 8,
  padding: 12,
  fontSize: 16,
  color: '#1E293B', // PASTIKAN ADA PROPERTI INI
  backgroundColor: '#FFFFFF',
},
  modalPriceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  currency: {
    paddingHorizontal: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  priceInput: {
    flex: 1,
    paddingVertical: 8,
    color: "#1E293B",
  },
  quantityContainer: {
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#F8FAFC",
  },
  quantityButton: {
    padding: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 8,
    minWidth: 60,
    textAlign: "center",
    backgroundColor: "#F8FAFC",
    color: "#1E293B",
  },
  nullableFieldsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  nullableSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },
  nullableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  nullableField: {
    flex: 1,
    gap: 4,
  },
  nullableInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  nullableInput: {
    flex: 1,
    padding: 8,
    color: "#1E293B",
  },
  nullButton: {
    padding: 8,
    backgroundColor: "#EF4444",
    borderRadius: 6,
    margin: 4,
  },
  nullButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  subtotalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
    marginTop: 12,
  },
  subtotalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  subtotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  totalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  totalLabel: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  additionalTotalsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  additionalTotal: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  additionalTotalLabel: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 8,
    fontWeight: "500",
  },
  additionalTotalInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  additionalTotalInput: {
    flex: 1,
    padding: 8,
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "600",
  },
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  addProductButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B5CF6",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addProductText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
  },
  modalList: {
    padding: 16,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#F8FAFC",
  },
  modalItemSelected: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  modalItemInfo: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E293B",
    marginBottom: 4,
  },
  modalItemPrice: {
    fontSize: 12,
    color: "#64748B",
  },
  modalEmpty: {
    alignItems: "center",
    padding: 20,
  },
  modalEmptyText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  modalForm: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 12,
  },
  modalInputGroup: {
    gap: 4,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "#F1F5F9",
  },
  modalCancelText: {
    color: "#64748B",
    fontWeight: "600",
  },
  modalConfirmButton: {
    backgroundColor: "#3B82F6",
  },
  modalConfirmText: {
    color: "white",
    fontWeight: "600",
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quantityItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  // Tambahkan styles untuk warning
  warningContainer: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  warningText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  warningIcon: {
    marginLeft: 4,
  },
  warningMessage: {
    fontSize: 10,
    color: '#EF4444',
    marginTop: 2,
    fontStyle: 'italic',
  },
});