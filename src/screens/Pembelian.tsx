// screens/POSPembelianScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions
} from "react-native";
import { collection, getDocs, addDoc, serverTimestamp, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

interface Product {
  id: string;
  nama: string;
  barcode: string;
  stok: number;
  harga_beli: number;
}

interface CartItem {
  productId: string;
  nama: string;
  barcode: string;
  harga_beli: number;
  quantity: number;
}

const PembelianScreen = () => {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("products");

  // Ambil storeId dari AsyncStorage
  useEffect(() => {
    const loadStoreId = async () => {
      const saved = await AsyncStorage.getItem("@pos:selectedTokoId");
      if (saved) {
        setStoreId(saved);
      } else {
        setLoading(false);
      }
    };
    loadStoreId();
  }, []);

  // Ambil produk setelah storeId ada
useEffect(() => {
  const loadProducts = async () => {
    if (!storeId) return;
    try {
      const coll = collection(db, `stores/${storeId}/produks`);
      const snap = await getDocs(coll);

      const loaded: Product[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          nama: data.nama,
          barcode: data.barcode,
          stok: data.stok ?? 0,
          harga_beli: data.harga_beli,
        };
      });

      // Urutkan produk berdasarkan nama (abjad)
      const sortedProducts = loaded.sort((a, b) => 
        a.nama.localeCompare(b.nama, 'id') // 'id' untuk locale Indonesia
      );
      
      setProducts(sortedProducts);
    } catch (error) {
      console.error("🔥 Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  loadProducts();
}, [storeId]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const exist = prev.find((i) => i.productId === product.id);
      if (exist) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          nama: product.nama,
          barcode: product.barcode,
          harga_beli: product.harga_beli,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty < 1) {
      // Remove item if quantity becomes 0
      setCart((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: newQty } : i
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce(
      (sum, item) => sum + item.harga_beli * item.quantity,
      0
    );
  };

  const processPurchase = async () => {
    if (!storeId) {
      Alert.alert("Error", "StoreId belum tersedia.");
      return;
    }
    if (cart.length === 0) {
      Alert.alert("Error", "Keranjang masih kosong.");
      return;
    }

    try {
      const total = calculateTotal();

      // 1. Simpan dokumen utama pembelian
      const pembelianRef = await addDoc(
        collection(db, `stores/${storeId}/pembelian`),
        {
          status: "pending",
          total_pembelian: total,
          tanggal: serverTimestamp(),
          invoice: `INV-${Date.now()}`,
        }
      );

      // 2. Simpan items ke subkoleksi items/
      for (const item of cart) {
        const itemRef = doc(
          collection(db, `stores/${storeId}/pembelian/${pembelianRef.id}/items`)
        );

        await setDoc(itemRef, {
          id_produk: item.productId,
          nama: item.nama,
          harga: item.harga_beli,
          jumlah_dipesan: item.quantity,
          jumlah_diterima: null,
          jumlah_ditambah: null,
          jumlah_diretur: null,
          subtotal: item.harga_beli * item.quantity,
        });
      }

      Alert.alert("Sukses", "Pembelian berhasil disimpan.");
      setCart([]);
    } catch (error) {
      console.error("🔥 Error simpan pembelian:", error);
      Alert.alert("Error", "Gagal menyimpan pembelian.");
    }
  };

  // Tambahkan tipe parameter pada fungsi updateHargaBeliProduk
  const updateHargaBeliProduk = async (productId: string, newHargaBeli: number) => {
    try {
      const storeId = await AsyncStorage.getItem("@pos:selectedTokoId");
      if (!storeId) return;
      const produkRef = doc(db, `stores/${storeId}/produks/${productId}`);
      await updateDoc(produkRef, { harga_beli: newHargaBeli });
    } catch (e) {
      console.error("Gagal update harga_beli produk:", e);
    }
  };

  // Tambahkan fungsi updateCartItemHargaBeli
  const updateCartItemHargaBeli = (productId: string, hargaBeliBaru: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, harga_beli: hargaBeliBaru } : item
      )
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Memuat produk...</Text>
      </View>
    );
  }

  // Filter produk berdasarkan search
  const filteredProducts = products.filter(
    (p) =>
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Pembelian</Text>
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'products' && styles.activeTab]} 
              onPress={() => setActiveTab('products')}
            >
              <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>Produk</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'cart' && styles.activeTab]} 
              onPress={() => setActiveTab('cart')}
            >
              <View style={styles.cartTab}>
                <Text style={[styles.tabText, activeTab === 'cart' && styles.activeTabText]}>Keranjang</Text>
                {cart.length > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cart.length}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === 'products' ? (
          <View style={styles.productsContainer}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Cari produk atau barcode..."
                placeholderTextColor="#94A3B8"
              />
            </View>

            <ScrollView style={styles.productsScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.productsGrid}>
                {filteredProducts.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.productCard}
                    onPress={() => addToCart(p)}
                  >
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>{p.nama}</Text>
                      <Text style={styles.productBarcode}>{p.barcode}</Text>
                      <Text style={styles.productStock}>Stok: {p.stok}</Text>
                    </View>
                    <View style={styles.productPriceContainer}>
                      <Text style={styles.productPrice}>Rp {p.harga_beli.toLocaleString('id-ID')}</Text>
                      <View style={styles.addButton}>
                        <Ionicons name="add-circle" size={24} color="#3B82F6" />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        ) : (
         <View style={styles.cartContainer}>
            <ScrollView 
              style={styles.cartScroll} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={cart.length === 0 ? styles.emptyCartContainer : {}}
            >
              {cart.length === 0 ? (
                <View style={styles.emptyCart}>
                  <MaterialIcons name="remove-shopping-cart" size={60} color="#CBD5E1" />
                  <Text style={styles.emptyCartText}>Keranjang kosong</Text>
                  <Text style={styles.emptyCartSubtext}>Tambahkan produk dari tab Produk</Text>
                </View>
              ) : (
                cart.map((item) => (
                  <View key={item.productId} style={styles.cartItem}>
                    <View style={styles.cartItemMain}>
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemName} numberOfLines={2}>{item.nama}</Text>
                        <View style={styles.priceRow}>
                          <Text style={styles.cartItemPrice}>Rp {item.harga_beli.toLocaleString('id-ID')}</Text>
                          <Text style={styles.cartItemSubtotal}>
                            Rp {(item.harga_beli * item.quantity).toLocaleString('id-ID')}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.cartItemControls}>
                        <View style={styles.quantityContainer}>
                          <TouchableOpacity 
                            style={styles.quantityButton}
                            onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            <Ionicons name="remove" size={18} color="#3B82F6" />
                          </TouchableOpacity>
                          <Text style={styles.quantityText}>{item.quantity}</Text>
                          <TouchableOpacity 
                            style={styles.quantityButton}
                            onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Ionicons name="add" size={18} color="#3B82F6" />
                          </TouchableOpacity>
                        </View>
                        
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => removeFromCart(item.productId)}
                        >
                          <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <View style={styles.hargaInputContainer}>
                      <Text style={styles.inputLabel}>Harga Beli:</Text>
                      <TextInput
                        style={styles.input}
                        value={item.harga_beli?.toString() || ""}
                        keyboardType="numeric"
                        onChangeText={async (val) => {
                          const hargaBeliBaru = parseInt(val) || 0;
                          updateCartItemHargaBeli(item.productId, hargaBeliBaru);
                          await updateHargaBeliProduk(item.productId, hargaBeliBaru);
                        }}
                      />
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {cart.length > 0 && (
              <View style={styles.cartFooter}>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total Pembelian:</Text>
                  <Text style={styles.totalAmount}>Rp {calculateTotal().toLocaleString('id-ID')}</Text>
                </View>
                <TouchableOpacity style={styles.checkoutButton} onPress={processPurchase}>
                  <Text style={styles.checkoutButtonText}>Proses Pembelian</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default PembelianScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  cartTab: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productsContainer: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    shadowColor: '#000',
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
    color: '#1E293B',
  },
  productsScroll: {
    flex: 1,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 40) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productInfo: {
    marginBottom: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  productBarcode: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 12,
    color: '#64748B',
  },
  productPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  addButton: {
    padding: 4,
  },
  cartContainer: {
    flex: 1,
  },
  emptyCartContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  cartItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cartItemMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#64748B',
  },
  cartItemSubtotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 4,
    marginRight: 12,
  },
  quantityButton: {
    padding: 6,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginHorizontal: 8,
    minWidth: 24,
    textAlign: 'center',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  hargaInputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  cartFooter: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  checkoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  cartScroll: {
    flex: 1,
    padding: 16,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  qtyBtn: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    paddingHorizontal: 12,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginHorizontal: 8,
    minWidth: 24,
    textAlign: 'center',
  },
});