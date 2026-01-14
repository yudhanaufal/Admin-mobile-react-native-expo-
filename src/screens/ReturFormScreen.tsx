import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
  Dimensions,
} from "react-native";
import { db } from "../firebase/firebase";
import { doc, getDoc, getDocs, collection, addDoc, setDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ReturItem } from "../services/returServices";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

// Interface untuk ProductItem props
interface ProductItemProps {
  item: any;
  onAdd: (product: any) => void;
  isReadOnly: boolean;
}

// Interface untuk CartItem props
interface CartItemProps {
  item: ReturItem;
  onUpdateQty: (id_produk: string, qty: number) => void;
  onRemove: (id_produk: string) => void;
  isReadOnly: boolean;
}

// Komponen terpisah untuk Product Item
const ProductItem = React.memo<ProductItemProps>(({ item, onAdd, isReadOnly }) => (
  <TouchableOpacity
    style={styles.productCard}
    onPress={() => onAdd(item)}
    disabled={isReadOnly}
  >
    <View style={styles.productInfo}>
      <Text style={styles.productName} numberOfLines={2}>{item.nama}</Text>
    </View>
    <View style={styles.productPriceContainer}>
      <Text style={styles.productPrice}>
        Rp {item.harga_beli?.toLocaleString("id-ID") || "0"}
      </Text>
      {!isReadOnly && (
        <View style={styles.addButton}>
          <Ionicons name="add-circle" size={24} color="#3B82F6" />
        </View>
      )}
    </View>
  </TouchableOpacity>
));

// Komponen terpisah untuk Cart Item
const CartItem = React.memo<CartItemProps>(({ item, onUpdateQty, onRemove, isReadOnly }) => (
  <View style={styles.cartItem}>
    <View style={styles.cartItemMain}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName} numberOfLines={2}>{item.nama}</Text>
        <Text style={styles.cartItemPrice}>
          Rp {item.harga_beli?.toLocaleString("id-ID") || "0"}
        </Text>
      </View>
      
      <View style={styles.cartItemControls}>
        <View style={styles.quantityContainer}>
          {!isReadOnly && (
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => onUpdateQty(item.id_produk, item.jumlah_retur - 1)}
            >
              <Ionicons name="remove" size={20} color="#3B82F6" />
            </TouchableOpacity>
          )}
          <TextInput
            style={styles.quantityInput}
            keyboardType="numeric"
            value={String(item.jumlah_retur)}
            onChangeText={(t) => onUpdateQty(item.id_produk, parseInt(t) || 0)}
            editable={!isReadOnly}
          />
          {!isReadOnly && (
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => onUpdateQty(item.id_produk, item.jumlah_retur + 1)}
            >
              <Ionicons name="add" size={20} color="#3B82F6" />
            </TouchableOpacity>
          )}
        </View>
        
        {!isReadOnly && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => onRemove(item.id_produk)}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
    
    <Text style={styles.cartItemSubtotal}>
      Rp {(item.harga_beli * item.jumlah_retur).toLocaleString("id-ID")}
    </Text>
  </View>
));

export default function ReturFormScreen() {
  type ReturFormRouteParams = {
    returId?: string;
    mode?: "create" | "edit" | "read";
  };
  const route = useRoute();
  const navigation = useNavigation();
  const { returId, mode } = (route.params as ReturFormRouteParams) || {};
  
  const [storeId, setStoreId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems] = useState<ReturItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [tanggal, setTanggal] = useState<string>("");
  const [activeTab, setActiveTab] = useState("products");

  const isReadOnly = mode === "read";
  const isEditMode = mode === "edit";

  useEffect(() => {
    const loadStoreId = async () => {
      const saved = await AsyncStorage.getItem("@pos:selectedTokoId");
      if (saved) setStoreId(saved);
      else setLoading(false);
    };
    loadStoreId();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      if (!storeId) return;
      try {
        const coll = collection(db, `stores/${storeId}/produks`);
        const snap = await getDocs(coll);
        const loaded = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            nama: data.nama,
            harga_beli: data.harga_beli || 0,
          };
        });
        setProducts(loaded);
      } catch (error) {
        console.error("🔥 Error loading products:", error);
        Alert.alert("Error", "Gagal memuat daftar produk");
      }
    };
    loadProducts();
  }, [storeId]);

  useEffect(() => {
    const loadData = async () => {
      if (!returId || mode === "create") {
        setLoading(false);
        return;
      }
      try {
        const storeId = await AsyncStorage.getItem("@pos:selectedTokoId");
        if (!storeId) return;
        const returDoc = await getDoc(doc(db, `stores/${storeId}/retur/${returId}`));
        if (returDoc.exists()) {
          const d = returDoc.data();
          setTanggal(d.tanggal);
          const itemsSnap = await getDocs(collection(db, `stores/${storeId}/retur/${returId}/items`));
          const list = itemsSnap.docs.map((item) => {
            const data = item.data();
            return {
              id: item.id,
              id_produk: data.id_produk,
              nama: data.nama,
              harga_beli: data.harga_beli || 0,
              jumlah_retur: data.jumlah_retur || 0,
              subtotal: data.subtotal || 0,
            };
          });
          setItems(list);
        }
      } catch (e) {
        console.error("🔥 Error load retur:", e);
        Alert.alert("Error", "Gagal memuat data retur");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [returId, mode]);

  const addToRetur = useCallback((product: any) => {
    if (isReadOnly) return;
    setItems((prev) => {
      const exist = prev.find((i) => i.id_produk === product.id);
      if (exist) {
        return prev.map((i) =>
          i.id_produk === product.id
            ? { 
                ...i, 
                jumlah_retur: i.jumlah_retur + 1, 
                subtotal: (i.jumlah_retur + 1) * i.harga_beli 
              }
            : i
        );
      }
      return [
        ...prev,
        {
          id: Math.random().toString(36).slice(2),
          id_produk: product.id,
          nama: product.nama,
          harga_beli: product.harga_beli,
          jumlah_retur: 1,
          subtotal: product.harga_beli,
        },
      ];
    });
  }, [isReadOnly]);

  const updateQty = useCallback((id_produk: string, qty: number) => {
    if (isReadOnly) return;
    if (qty < 0) return;
    setItems((prev) =>
      prev.map((it) =>
        it.id_produk === id_produk
          ? { ...it, jumlah_retur: qty, subtotal: it.harga_beli * qty }
          : it
      )
    );
  }, [isReadOnly]);

  const removeItem = useCallback((id_produk: string) => {
    if (isReadOnly) return;
    Alert.alert(
      "Hapus Item",
      "Apakah Anda yakin ingin menghapus item ini?",
      [
        {
          text: "Batal",
          style: "cancel"
        },
        {
          text: "Hapus",
          onPress: () => {
            setItems((prev) => prev.filter((i) => i.id_produk !== id_produk));
          }
        }
      ]
    );
  }, [isReadOnly]);

  const saveRetur = async () => {
    try {
      const storeId = await AsyncStorage.getItem("@pos:selectedTokoId");
      if (!storeId) {
        Alert.alert("Error", "StoreId belum tersedia.");
        return;
      }
      if (items.length === 0) {
        Alert.alert("Error", "Keranjang retur masih kosong.");
        return;
      }
      
      const total = items.reduce((s, it) => s + it.subtotal, 0);
      
      if (isEditMode && returId) {
        // Update existing retur
        // Note: You'll need to implement update functionality
        Alert.alert("Info", "Fitur edit retur akan segera tersedia");
        return;
      }
      
      // Create new retur
      const returRef = await addDoc(
        collection(db, `stores/${storeId}/retur`),
        {
          total_retur: total,
          tanggal: new Date().toISOString(),
        }
      );
      
      for (const item of items) {
        const itemRef = doc(
          collection(db, `stores/${storeId}/retur/${returRef.id}/items`)
        );
        await setDoc(itemRef, {
          id_produk: item.id_produk,
          nama: item.nama,
          harga_beli: item.harga_beli,
          jumlah_retur: item.jumlah_retur,
          subtotal: item.subtotal,
        });
      }
      
      Alert.alert(
        "Sukses", 
        "Retur berhasil disimpan",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (e) {
      console.error("🔥 Error save retur:", e);
      Alert.alert("Error", "Gagal simpan retur");
    }
  };

  const filteredProducts = products.filter((p) =>
    p.nama.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isReadOnly ? "Detail Retur" : isEditMode ? "Edit Retur" : "Buat Retur"}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'products' && styles.activeTab]} 
                onPress={() => setActiveTab('products')}
              >
                <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
                  Produk
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'cart' && styles.activeTab]} 
                onPress={() => setActiveTab('cart')}
              >
                <View style={styles.cartTab}>
                  <Text style={[styles.tabText, activeTab === 'cart' && styles.activeTabText]}>
                    Keranjang
                  </Text>
                  {items.length > 0 && (
                    <View style={styles.cartBadge}>
                      <Text style={styles.cartBadgeText}>{items.length}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {activeTab === 'products' ? (
              <View style={styles.productsContainer}>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Cari produk..."
                    placeholderTextColor="#94A3B8"
                    value={search}
                    onChangeText={setSearch}
                    editable={!isReadOnly}
                  />
                </View>

                <FlatList
                  data={filteredProducts}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <ProductItem 
                      item={item} 
                      onAdd={addToRetur} 
                      isReadOnly={isReadOnly} 
                    />
                  )}
                  contentContainerStyle={styles.productsList}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <MaterialIcons name="search-off" size={48} color="#CBD5E1" />
                      <Text style={styles.emptyText}>Produk tidak ditemukan</Text>
                    </View>
                  }
                  initialNumToRender={10}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  removeClippedSubviews={true}
                />
              </View>
            ) : (
              <View style={styles.cartContainer}>
                {items.length === 0 ? (
                  <View style={styles.emptyCartContainer}>
                    <View style={styles.emptyCart}>
                      <MaterialIcons name="remove-shopping-cart" size={64} color="#CBD5E1" />
                      <Text style={styles.emptyCartText}>Keranjang kosong</Text>
                      <Text style={styles.emptyCartSubtext}>
                        Tambahkan produk dari tab Produk
                      </Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <FlatList
                      data={items}
                      keyExtractor={(item) => item.id_produk}
                      renderItem={({ item }) => (
                        <CartItem 
                          item={item} 
                          onUpdateQty={updateQty} 
                          onRemove={removeItem} 
                          isReadOnly={isReadOnly} 
                        />
                      )}
                      contentContainerStyle={styles.cartList}
                      initialNumToRender={10}
                      maxToRenderPerBatch={10}
                      windowSize={5}
                      removeClippedSubviews={true}
                    />
                    
                    <View style={styles.totalContainer}>
                      <Text style={styles.totalLabel}>Total Retur</Text>
                      <Text style={styles.totalAmount}>
                        Rp {total.toLocaleString("id-ID")}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            )}
            
            {/* Action Buttons */}
            {!isReadOnly && items.length > 0 && (
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveRetur}
              >
                <Text style={styles.saveButtonText}>
                  {isEditMode ? "UPDATE RETUR" : "SIMPAN RETUR"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#3B82F6",
    padding: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerRight: {
    width: 32,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    margin: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  activeTabText: {
    color: "#3B82F6",
  },
  cartTab: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
  cartBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  productsContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1E293B",
  },
  productsList: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 16,
  },
  productCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productInfo: {
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  productPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  addButton: {
    padding: 4,
  },
  cartContainer: {
    flex: 1,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCart: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 16,
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 4,
    textAlign: "center",
  },
  cartList: {
    padding: 16,
    paddingBottom: 100,
  },
  cartItem: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cartItemMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    color: "#64748B",
  },
  cartItemControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 4,
    marginRight: 12,
  },
  quantityButton: {
    padding: 6,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 8,
    minWidth: 60,
    textAlign: "center",
    backgroundColor: "white",
    color: "#1E293B",
  },
  deleteButton: {
    padding: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
  },
  cartItemSubtotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3B82F6",
    textAlign: "right",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
  },
  totalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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
  saveButton: {
    backgroundColor: "#10B981",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});