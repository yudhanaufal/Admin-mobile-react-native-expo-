// screens/LaporanOperasionalScreen.tsx
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
import { OperasionalService } from '../services/LaporanOperasionalService';
import { LaporanOperasionalData } from '../models/LaporanOperasional';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const LaporanOperasionalScreen = () => {
  const [laporan, setLaporan] = useState<LaporanOperasionalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    loadLaporan(startDate, endDate);
  }, []);

  const loadLaporan = async (start: Date, end: Date) => {
    try {
      setLoading(true);
      setError(null);
      

      
      const data = await OperasionalService.getLaporanOperasionalPeriode(start, end);
      setLaporan(data);
      
  
      
    } catch (err: any) {
      console.error('Error loading laporan operasional:', err);
      setError('Gagal memuat data operasional. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (amount: number): string => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (date: Date): string => {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleFilter = () => {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    loadLaporan(startDate, end);
  };

  const handleResetFilter = () => {
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    
    setStartDate(start);
    setEndDate(end);
    loadLaporan(start, end);
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Memuat laporan operasional...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Laporan Operasional</Text>
        <Text style={styles.headerSubtitle}>Pengeluaran Operasional Toko</Text>
      </View>

      {/* Filter Section */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Filter Tanggal</Text>
        
        <View style={styles.dateFilterRow}>
          <View style={styles.dateInput}>
            <Text style={styles.dateLabel}>Dari Tanggal</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#007AFF" />
              <Text style={styles.dateButtonText}>
                {formatShortDate(startDate)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateInput}>
            <Text style={styles.dateLabel}>Sampai Tanggal</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#007AFF" />
              <Text style={styles.dateButtonText}>
                {formatShortDate(endDate)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterButtons}>
          <TouchableOpacity 
            style={[styles.filterButton, styles.resetButton]}
            onPress={handleResetFilter}
          >
            <Text style={styles.resetButtonText}>Hari Ini</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, styles.applyButton]}
            onPress={handleFilter}
          >
            <Text style={styles.applyButtonText}>Terapkan Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={onStartDateChange}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={onEndDateChange}
          />
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={24} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleResetFilter} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.totalCard]}>
          <Ionicons name="cash-outline" size={24} color="#FF3B30" />
          <Text style={styles.summaryLabel}>Total Pengeluaran</Text>
          <Text style={styles.summaryValue}>
            {formatRupiah(laporan?.totalPengeluaran || 0)}
          </Text>
        </View>

        <View style={[styles.summaryCard, styles.transactionCard]}>
          <Ionicons name="document-text-outline" size={24} color="#007AFF" />
          <Text style={styles.summaryLabel}>Jumlah Transaksi</Text>
          <Text style={styles.summaryValue}>
            {laporan?.jumlahTransaksi || 0}
          </Text>
        </View>

        <View style={[styles.summaryCard, styles.averageCard]}>
          <Ionicons name="stats-chart-outline" size={24} color="#4CAF50" />
          <Text style={styles.summaryLabel}>Rata-rata</Text>
          <Text style={styles.summaryValue}>
            {formatRupiah(laporan?.rataRataPengeluaran || 0)}
          </Text>
        </View>
      </View>

      {/* Breakdown by Type */}
      {laporan && Object.keys(laporan.breakdownByType).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Breakdown by Kategori</Text>
          {Object.entries(laporan.breakdownByType).map(([type, amount]) => (
            <View key={type} style={styles.breakdownRow}>
              <Text style={styles.breakdownType}>{type}</Text>
              <Text style={styles.breakdownAmount}>
                {formatRupiah(amount)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Operasional List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daftar Pengeluaran</Text>
          <Text style={styles.operasionalCount}>({laporan?.operasional.length || 0})</Text>
        </View>
        
        {laporan?.operasional.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Tidak ada pengeluaran pada periode ini</Text>
          </View>
        ) : (
          laporan?.operasional.map((operasional) => (
            <View key={operasional.id} style={styles.operasionalCard}>
              <View style={styles.operasionalHeader}>
                <View>
                  <Text style={styles.operasionalDate}>
                    {formatDate(operasional.tanggal)}
                  </Text>
                  <Text style={styles.operasionalTime}>
                    {formatTime(operasional.tanggal)}
                  </Text>
                </View>
                <Text style={styles.operasionalTotal}>
                  {formatRupiah(operasional.total)}
                </Text>
              </View>

              {operasional.items && operasional.items.length > 0 && (
                <View style={styles.itemsContainer}>
                  <Text style={styles.itemsTitle}>Detail Item:</Text>
                  {operasional.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemDescription}>{item.description}</Text>
                        <Text style={styles.itemType}>{item.type}</Text>
                      </View>
                      <Text style={styles.itemAmount}>
                        {formatRupiah(item.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {operasional.catatan && (
                <View style={styles.catatanContainer}>
                  <Text style={styles.catatanLabel}>Catatan:</Text>
                  <Text style={styles.catatanText}>{operasional.catatan}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  filterContainer: {
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  dateFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButtonText: {
    marginLeft: 8,
    color: '#333',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  resetButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  applyButton: {
    backgroundColor: '#007AFF',
  },
  resetButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF3B30',
    marginVertical: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryCard: {
    alignItems: 'center',
    flex: 1,
    padding: 8,
    borderRadius: 8,
  },
  totalCard: {
    backgroundColor: '#FFEBEE',
  },
  transactionCard: {
    backgroundColor: '#E3F2FD',
    marginHorizontal: 8,
  },
  averageCard: {
    backgroundColor: '#E8F5E9',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  operasionalCount: {
    color: '#666',
    fontSize: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownType: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  breakdownAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
    fontSize: 16,
  },
  operasionalCard: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  operasionalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  operasionalDate: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
  },
  operasionalTime: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  operasionalTotal: {
    fontWeight: 'bold',
    color: '#FF3B30',
    fontSize: 16,
  },
  itemsContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemsTitle: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemDescription: {
    fontSize: 14,
    color: '#333',
  },
  itemType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3B30',
  },
  catatanContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  catatanLabel: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  catatanText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default LaporanOperasionalScreen;