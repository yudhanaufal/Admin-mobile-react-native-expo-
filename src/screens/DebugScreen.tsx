// screens/DebugScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { SetoranService } from '../services/LaporanSetoranService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DebugScreen = () => {
  const [setoranData, setSetoranData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tokoId, setTokoId] = useState<string>('');

  const loadSetoranData = async () => {
    setLoading(true);
    try {
      const selectedTokoId = await AsyncStorage.getItem('@pos:selectedTokoId');
      
      if (!selectedTokoId) {
        Alert.alert('Error', 'Toko belum dipilih');
        return;
      }

      setTokoId(selectedTokoId);
      const data = await SetoranService.debugSetoranData(selectedTokoId);
      setSetoranData(data);
      
      if (data.length === 0) {
        Alert.alert(
          'Tidak Ada Data Setoran',
          `Tidak ditemukan data setoran di path: stores/${selectedTokoId}/setoran\n\nPastikan:\n1. Subcollection "setoran" ada\n2. Ada data di dalamnya\n3. Rules mengizinkan read`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error loading setoran data:', error);
      Alert.alert('Error', 'Gagal memuat data setoran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSetoranData();
  }, []);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object' && value.toDate) {
      return value.toDate().toString();
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '[Complex Object]';
      }
    }
    return String(value);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Memuat data setoran...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Data Setoran</Text>
        <Text style={styles.subtitle}>Path: stores/{tokoId}/setoran</Text>
        <Text style={styles.subtitle}>Total: {setoranData.length} documents</Text>
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={loadSetoranData}>
        <Ionicons name="refresh" size={20} color="#007AFF" />
        <Text style={styles.refreshText}>Refresh Data</Text>
      </TouchableOpacity>

      {setoranData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open" size={48} color="#ff9500" />
          <Text style={styles.emptyTitle}>Subcollection Setoran Kosong</Text>
          <Text style={styles.emptyText}>
            Tidak ditemukan data di: stores/{tokoId}/setoran
          </Text>
          <Text style={styles.helpText}>
            Pastikan Anda sudah:
            {"\n"}1. Membuat subcollection "setoran" di document toko
            {"\n"}2. Menambahkan data setoran
            {"\n"}3. Rules Firestore mengizinkan read
          </Text>
        </View>
      ) : (
        setoranData.map((item, index) => (
          <View key={index} style={styles.dataCard}>
            <Text style={styles.docId}>ID: {item.id}</Text>
            
            {Object.entries(item)
              .filter(([key]) => key !== 'id')
              .map(([key, value]) => (
                <View key={key} style={styles.fieldRow}>
                  <Text style={styles.fieldName}>{key}:</Text>
                  <Text style={styles.fieldValue}>{formatValue(value)}</Text>
                </View>
              ))}
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  refreshText: {
    marginLeft: 8,
    color: '#007AFF',
    fontWeight: '600',
  },
  dataCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  docId: {
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
    fontSize: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fieldName: {
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  fieldValue: {
    color: '#666',
    flex: 2,
    textAlign: 'right',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff9500',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
    fontSize: 14,
  },
  helpText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
  },
});

export default DebugScreen;