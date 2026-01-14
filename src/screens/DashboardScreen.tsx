import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, FontAwesome5, Ionicons, Feather, AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const navigation = useNavigation<any>();

  const menuItems = [
    {
      title: "Produk",
      icon: <Ionicons name="cube-outline" size={28} color="#2196F3" />,
      screen: "ProductList",
      color: "#2196F3",
      headerShown: false
    },
    {
      title: "Pembelian",
      icon: <FontAwesome5 name="shopping-cart" size={26} color="#FF9800" />,
      screen: "PembelianList",
      color: "#FF9800",
      headerShown: false
    },
    {
      title: "Laporan Transaksi",
      icon: <MaterialIcons name="receipt" size={28} color="#009688" />,
      screen: "Laporan_p",
      color: "#009688",
      headerShown: false
    },
    {
      title: "Laporan Setoran",
      icon: <MaterialIcons name="attach-money" size={28} color="#8BC34A" />,
      screen: "LaporanSetoran",
      color: "#8BC34A",
      headerShown: false
    },
    {
      title: "Laporan Operasional",
      icon: <Feather name="activity" size={28} color="#FF5722" />,
      screen: "LaporanOperasional",
      color: "#FF5722",
      headerShown: false
    },
    {
      title: "Retur",
      icon: <MaterialIcons name="assignment-return" size={28} color="#E91E63" />,
      screen: "ReturList",
      color: "#E91E63",
      headerShown: false
    },
  ];

  

  return (
    <LinearGradient
      colors={['#f5f7fa', '#e4e8f0']}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Selamat Siang,</Text>
          <Text style={styles.title}>Admin Toko</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-circle-outline" size={32} color="#333" />
        </TouchableOpacity>
      </View>

      

      {/* Quick Actions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Menu Utama</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Lihat Semua</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { borderLeftColor: item.color }]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                {item.icon}
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>
            </View>
            <View style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Navigation Placeholder */}

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: "#666",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  profileButton: {
    padding: 8,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsContent: {
    paddingHorizontal: 4,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: width * 0.65,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  gridContainer: {
    paddingBottom: 80,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 12,
    color: '#888',
  },
  arrowContainer: {
    marginLeft: 8,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navItem: {
    alignItems: 'center',
    padding: 8,
  },
  navItemActive: {
    alignItems: 'center',
    padding: 8,
  },
  navText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  navTextActive: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
    marginTop: 4,
  },
});