// src/screens/ReturListScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { returService, Retur } from "../services/returServices";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function ReturListScreen() {
  const [returs, setReturs] = useState<Retur[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const storeId = await AsyncStorage.getItem("@pos:selectedTokoId");
    if (!storeId) {
      setReturs([]);
      setLoading(false);
      return;
    }
    try {
      const data = await returService.getAllByStore(storeId);
      // Sort by date descending
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.tanggal);
        const dateB = new Date(b.tanggal);
        return dateB.getTime() - dateA.getTime();
      });
      setReturs(sortedData);
    } catch (error) {
      console.error("Error loading retur data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Memuat data retur...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daftar Retur</Text>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{returs.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={returs}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="assignment-return" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>Belum ada retur</Text>
            <Text style={styles.emptySubtext}>
              Mulai dengan membuat retur baru
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              navigation.navigate("ReturFormScreen", { 
                mode: "read", 
                returId: item.id 
              });
            }}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.returId}>#{item.id.substring(0, 8)}</Text>
              </View>
              <Text style={styles.date}>{formatDate(item.tanggal)}</Text>
            </View>
            
            <View style={styles.cardBody}>
              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>Total Retur</Text>
                <Text style={styles.amount}>
                  Rp {item.total_retur?.toLocaleString("id-ID") || "0"}
                </Text>
              </View>
            </View>
            
            <View style={styles.cardFooter}>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() => {
                    navigation.navigate("ReturFormScreen", { 
                      mode: "read", 
                      returId: item.id 
                    });
                  }}
                >
                  <Ionicons name="eye" size={16} color="#3B82F6" />
                  <Text style={styles.detailButtonText}>Detail</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    navigation.navigate("ReturFormScreen", { 
                      mode: "edit", 
                      returId: item.id 
                    });
                  }}
                >
                  <Ionicons name="create-outline" size={16} color="#8B5CF6" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("ReturFormScreen", { mode: "create" })}
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
  headerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
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
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  returId: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: "#64748B",
  },
  cardBody: {
    marginBottom: 12,
  },
  amountContainer: {
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  detailButtonText: {
    color: "#3B82F6",
    fontSize: 12,
    fontWeight: "500",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  editButtonText: {
    color: "#8B5CF6",
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
});