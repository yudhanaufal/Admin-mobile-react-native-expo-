import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/index";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';

type NavProp = NativeStackNavigationProp<RootStackParamList, "PembelianList">;

interface Pembelian {
  id: string;
  invoice: string;
  total_pembelian: number;
  total_retur: number;
  total_tambah: number;
  status: string;
  tanggal: Date | null;
}

export default function PembelianListScreen() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [pembelian, setPembelian] = useState<Pembelian[]>([]);
  const [filteredPembelian, setFilteredPembelian] = useState<Pembelian[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // State untuk total pembelian
  const [totalPembelian, setTotalPembelian] = useState(0);
  const [totalRetur, setTotalRetur] = useState(0);
  const [totalTambah, setTotalTambah] = useState(0);
  const [netPembelian, setNetPembelian] = useState(0);

  const navigation = useNavigation<NavProp>();

  useEffect(() => {
    const loadStoreId = async () => {
      const saved = await AsyncStorage.getItem("@pos:selectedTokoId");
      if (saved) setStoreId(saved);
      else setLoading(false);
    };
    loadStoreId();
  }, []);

  const loadPembelian = async () => {
    if (!storeId) return;
    try {
      const q = query(
        collection(db, `stores/${storeId}/pembelian`),
        orderBy("tanggal", "desc")
      );
      const snap = await getDocs(q);
      const list: Pembelian[] = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          invoice: d.invoice,
          total_pembelian: d.total_pembelian || 0,
          total_retur: d.total_retur || 0,
          total_tambah: d.total_tambah || 0,
          status: d.status,
          tanggal: d.tanggal?.toDate ? d.tanggal.toDate() : null,
        };
      });
      setPembelian(list);
      setFilteredPembelian(list);
      
      // Hitung total pembelian
      calculateTotals(list);
    } catch (e) {
      console.error("Error load pembelian:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fungsi untuk menghitung total pembelian
  const calculateTotals = (data: Pembelian[]) => {
    const totalPembelian = data.reduce((sum, item) => sum + item.total_pembelian, 0);
    const totalRetur = data.reduce((sum, item) => sum + item.total_retur, 0);
    const totalTambah = data.reduce((sum, item) => sum + item.total_tambah, 0);
    const netPembelian = totalPembelian - totalRetur + totalTambah;
    
    setTotalPembelian(totalPembelian);
    setTotalRetur(totalRetur);
    setTotalTambah(totalTambah);
    setNetPembelian(netPembelian);
  };

  useEffect(() => {
    loadPembelian();
  }, [storeId]);

  const applyDateFilter = () => {
    if (!startDate && !endDate) {
      setFilteredPembelian(pembelian);
      calculateTotals(pembelian);
      return;
    }

    const filtered = pembelian.filter((item) => {
      if (!item.tanggal) return false;

      const itemDate = new Date(item.tanggal);
      itemDate.setHours(0, 0, 0, 0);

      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return itemDate >= start && itemDate <= end;
      }

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        return itemDate >= start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return itemDate <= end;
      }

      return true;
    });

    setFilteredPembelian(filtered);
    calculateTotals(filtered);
    setShowFilterModal(false);
  };

  const clearFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setFilteredPembelian(pembelian);
    calculateTotals(pembelian);
    setShowFilterModal(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPembelian();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "#10B981";
      case "pending":
        return "#F59E0B";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Selesai";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Pilih tanggal";
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Memuat data pembelian...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Daftar Pembelian</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter" size={20} color="white" />
            {(startDate || endDate) && <View style={styles.filterIndicator} />}
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{filteredPembelian.length}</Text>
            <Text style={styles.statLabel}>Total Transaksi</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {filteredPembelian.filter(p => p.status === "confirmed").length}
            </Text>
            <Text style={styles.statLabel}>Selesai</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {filteredPembelian.filter(p => p.status === "pending").length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Ringkasan Pembelian</Text>
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Pembelian</Text>
            <Text style={styles.summaryValue}>
              Rp {totalPembelian.toLocaleString("id-ID")}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Retur</Text>
            <Text style={[styles.summaryValue, styles.returText]}>
              Rp {totalRetur.toLocaleString("id-ID")}
            </Text>
          </View>
        </View>
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Tambah</Text>
            <Text style={[styles.summaryValue, styles.tambahText]}>
              Rp {totalTambah.toLocaleString("id-ID")}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Net Pembelian</Text>
            <Text style={[styles.summaryValue, styles.netText]}>
              Rp {netPembelian.toLocaleString("id-ID")}
            </Text>
          </View>
        </View>
        
        {(startDate || endDate) && (
          <View style={styles.filterInfo}>
            <Ionicons name="information-circle" size={16} color="#3B82F6" />
            <Text style={styles.filterInfoText}>
              Menampilkan data dari {startDate ? formatDate(startDate) : "awal"} 
              {" sampai "} 
              {endDate ? formatDate(endDate) : "sekarang"}
            </Text>
          </View>
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Tanggal</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>Dari Tanggal</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateInputText}>{formatDate(startDate)}</Text>
                <Ionicons name="calendar" size={20} color="#6B7280" />
              </TouchableOpacity>

              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowStartDatePicker(false);
                    if (selectedDate) {
                      setStartDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>Sampai Tanggal</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateInputText}>{formatDate(endDate)}</Text>
                <Ionicons name="calendar" size={20} color="#6B7280" />
              </TouchableOpacity>

              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowEndDatePicker(false);
                    if (selectedDate) {
                      setEndDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.clearButton]}
                onPress={clearFilter}
              >
                <Text style={styles.clearButtonText}>Hapus Filter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={applyDateFilter}
              >
                <Text style={styles.applyButtonText}>Terapkan Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        data={filteredPembelian}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              {pembelian.length === 0 ? "Belum ada pembelian" : "Tidak ada data yang sesuai filter"}
            </Text>
            <Text style={styles.emptySubtext}>
              {pembelian.length === 0 
                ? "Mulai dengan membuat pembelian baru" 
                : "Coba ubah filter tanggal Anda"
              }
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("PembelianDetail", { pembelianId: item.id })
            }
          >
            <View style={styles.cardHeader}>
              <Text style={styles.invoice}>{item.invoice}</Text>
              <View 
                style={[
                  styles.statusBadge, 
                  { backgroundColor: getStatusColor(item.status) + "20" }
                ]}
              >
                <Text 
                  style={[
                    styles.statusText, 
                    { color: getStatusColor(item.status) }
                  ]}
                >
                  {getStatusText(item.status)}
                </Text>
              </View>
            </View>
            
            <View style={styles.cardBody}>
              <View style={styles.amountRow}>
                <View style={styles.amountContainer}>
                  <Text style={styles.amountLabel}>Total Pembelian</Text>
                  <Text style={styles.amount}>
                    Rp {item.total_pembelian?.toLocaleString("id-ID") || "0"}
                  </Text>
                </View>
                
                <View style={styles.verticalDivider} />
                
                <View style={styles.amountContainer}>
                  <Text style={styles.amountLabel}>Total Retur</Text>
                  <Text style={[styles.amount, styles.returAmount]}>
                    Rp {item.total_retur?.toLocaleString("id-ID") || "0"}
                  </Text>
                </View>
              </View>

              <View style={styles.amountRow}>
                <View style={styles.amountContainer}>
                  <Text style={styles.amountLabel}>Total Tambah</Text>
                  <Text style={[styles.amount, styles.tambahAmount]}>
                    Rp {item.total_tambah?.toLocaleString("id-ID") || "0"}
                  </Text>
                </View>
                
                <View style={styles.verticalDivider} />
                
                <View style={styles.amountContainer}>
                  <Text style={styles.amountLabel}>Net Pembelian</Text>
                  <Text style={[styles.amount, styles.netAmount]}>
                    Rp {(item.total_pembelian - item.total_retur + item.total_tambah)?.toLocaleString("id-ID") || "0"}
                  </Text>
                </View>
              </View>
              
              <View style={styles.dateContainer}>
                <Ionicons name="time-outline" size={16} color="#64748B" />
                <Text style={styles.date}>
                  {item.tanggal 
                    ? item.tanggal.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"
                  }
                </Text>
              </View>
            </View>
            
            <View style={styles.cardFooter}>
              <Text style={styles.viewDetail}>
                Lihat detail <Ionicons name="chevron-forward" size={14} />
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (storeId) {
            navigation.navigate("PembelianScreen", { storeId });
          }
        }}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
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
    backgroundColor: "#3B82F6",
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    position: "relative",
  },
  filterIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  headerStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    marginTop: 4,
  },
  // Summary Card Styles
  summaryCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    paddingHorizontal: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  returText: {
    color: "#EF4444",
  },
  tambahText: {
    color: "#10B981",
  },
  netText: {
    color: "#8B5CF6",
  },
  filterInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
  },
  filterInfoText: {
    fontSize: 12,
    color: "#3B82F6",
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
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
    alignItems: "center",
    marginBottom: 12,
  },
  invoice: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#1E293B",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardBody: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  amountContainer: {
    flex: 1,
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
    textAlign: "center",
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3B82F6",
    textAlign: "center",
  },
  returAmount: {
    color: "#EF4444",
  },
  tambahAmount: {
    color: "#10B981",
  },
  netAmount: {
    color: "#8B5CF6",
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  date: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 4,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
    alignItems: "flex-end",
  },
  viewDetail: {
    color: "#3B82F6",
    fontSize: 12,
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  dateInputContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#F9FAFB",
  },
  dateInputText: {
    fontSize: 14,
    color: "#374151",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  clearButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  applyButton: {
    backgroundColor: "#3B82F6",
  },
  clearButtonText: {
    color: "#374151",
    fontWeight: "500",
  },
  applyButtonText: {
    color: "white",
    fontWeight: "500",
  },
});