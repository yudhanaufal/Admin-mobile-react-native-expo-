import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Modal,
  TextInput,
  Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function PilihToko() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tokoList, setTokoList] = useState<any[]>([]);
  const [selectedToko, setSelectedToko] = useState<any>(null);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const nav = useNavigation();

  async function loadToko() {
    try {
      const snap = await getDocs(collection(db, "stores"));
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setTokoList(list);
    } catch (error) {
      console.error("Error loading stores:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handlePilihToko(toko: any) {
    setSelectedToko(toko);
    setPinModalVisible(true);
  }

  async function verifyPin() {
  if (!selectedToko) return;
  
  try {
    // Jika toko tidak memiliki PIN, langsung lanjutkan
    if (!selectedToko.pin) {
      await proceedToDashboard();
      return;
    }

    if (pin.length < 4) {
      setPinError("PIN harus 4 digit");
      return;
    }

    // Konversi kedua nilai ke string sebelum membandingkan
    if (pin !== selectedToko.pin.toString()) {
      setPinError("PIN salah");
      return;
    }

    await proceedToDashboard();
  } catch (error) {
    console.error("Error verifying PIN:", error);
    Alert.alert("Error", "Terjadi kesalahan saat memverifikasi PIN");
  }
}

  async function proceedToDashboard() {
    await AsyncStorage.setItem("@pos:selectedTokoId", selectedToko.id);
    setPinModalVisible(false);
    setPin("");
    setPinError("");
    nav.navigate("Dashboard" as never);
  }

  function onRefresh() {
    setRefreshing(true);
    loadToko();
  }

  useEffect(() => {
    loadToko();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Memuat daftar toko...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      >
       <View style={styles.header}>
           <Text style={styles.title}>Silakan pilih toko yang ingin dikelola </Text>
           <Text style={styles.title}>😎😎😎😎 </Text>
       </View>

        {tokoList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="store" size={50} color="#d1d5db" />
            <Text style={styles.emptyText}>Tidak ada toko tersedia</Text>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={onRefresh}
            >
              <Icon name="refresh" size={20} color="#3b82f6" />
              <Text style={styles.refreshText}>Muat Ulang</Text>
            </TouchableOpacity>
          </View>
        ) : (
          tokoList.map((toko) => (
            <TouchableOpacity
              key={toko.id}
              style={styles.card}
              onPress={() => handlePilihToko(toko)}
              activeOpacity={0.8}
            >
              <View style={styles.cardIcon}>
                <Icon name="store" size={24} color="#3b82f6" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.name}>{toko.nama}</Text>
                {toko.alamat && (
                  <Text style={styles.address} numberOfLines={1}>
                    {toko.alamat}
                  </Text>
                )}
              </View>
              <Icon name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Modal untuk memasukkan PIN */}
      <Modal
        visible={pinModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setPinModalVisible(false);
          setPin("");
          setPinError("");
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Masukkan PIN Toko</Text>
            <Text style={styles.modalSubtitle}>
              {selectedToko?.nama || 'Toko ini'} {selectedToko?.pin ? 'memerlukan PIN' : 'tidak memerlukan PIN'}
            </Text>
            
            {selectedToko?.pin && (
              <>
                <TextInput
                  style={[styles.pinInput, pinError ? styles.inputError : null]}
                  placeholder="Masukkan 4 digit PIN"
                  keyboardType="numeric"
                  secureTextEntry={true}
                  maxLength={4}
                  value={pin}
                  onChangeText={(text) => {
                    setPin(text);
                    if (pinError) setPinError("");
                  }}
                />
                {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setPinModalVisible(false);
                  setPin("");
                  setPinError("");
                }}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={verifyPin}
                disabled={selectedToko?.pin && pin.length < 4}
              >
                <Text style={styles.confirmButtonText}>Masuk</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center', 
    justifyContent: 'center', 
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardIcon: {
    backgroundColor: '#eff6ff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  refreshText: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  pinInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});