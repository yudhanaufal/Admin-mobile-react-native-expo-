// screens/LaporanSetoranScreen.tsx
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
import { LaporanSetoranData } from '../models/LaporanSetoran';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const LaporanSetoranScreen = () => {
  const [laporan, setLaporan] = useState<LaporanSetoranData | null>(null);
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
      
 
      const data = await SetoranService.getLaporanSetoranPeriode(start, end);
      setLaporan(data);
      

    } catch (err: any) {
      console.error('Error loading laporan setoran:', err);
      setError('Gagal memuat data setoran. Silakan coba lagi.');
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
        <Text style={styles.loadingText}>Memuat laporan setoran...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Laporan Setoran Kasir</Text>
        <Text style={styles.headerSubtitle}>Rekap Harian Setoran</Text>
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
        <View style={[styles.summaryCard, styles.cashCard]}>
          <Ionicons name="cash" size={24} color="#4CAF50" />
          <Text style={styles.summaryLabel}>Total Tunai</Text>
          <Text style={styles.summaryValue}>
            {formatRupiah(laporan?.totalCash || 0)}
          </Text>
        </View>

        <View style={[styles.summaryCard, styles.qrisCard]}>
          <Ionicons name="phone-portrait" size={24} color="#2196F3" />
          <Text style={styles.summaryLabel}>Total QRIS</Text>
          <Text style={styles.summaryValue}>
            {formatRupiah(laporan?.totalQris || 0)}
          </Text>
        </View>

        <View style={[styles.summaryCard, styles.transferCard]}>
          <Ionicons name="swap-horizontal" size={24} color="#FF9800" />
          <Text style={styles.summaryLabel}>Total Transfer</Text>
          <Text style={styles.summaryValue}>
            {formatRupiah(laporan?.totalTransfer || 0)}
          </Text>
        </View>
      </View>

      {/* Total Keseluruhan */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>TOTAL KESELURUHAN</Text>
        <Text style={styles.totalValue}>
          {formatRupiah(laporan?.totalKeseluruhan || 0)}
        </Text>
        <Text style={styles.totalCount}>
          {laporan?.jumlahSetoran || 0} Setoran
        </Text>
      </View>

      {/* Setoran List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daftar Setoran</Text>
          <Text style={styles.setoranCount}>({laporan?.setoran.length || 0})</Text>
        </View>
        
        {laporan?.setoran.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Tidak ada setoran pada periode ini</Text>
          </View>
        ) : (
          laporan?.setoran.map((setoran) => (
            <View key={setoran.id} style={styles.setoranCard}>
              <View style={styles.setoranHeader}>
                <View>
                  <Text style={styles.setoranDate}>
                    {formatDate(setoran.tanggal)}
                  </Text>
                  <Text style={styles.setoranTime}>
                    {formatTime(setoran.tanggal)}
                  </Text>
                </View>
                <Text style={styles.setoranTotal}>
                  {formatRupiah(setoran.total)}
                </Text>
              </View>

              <View style={styles.setoranDetails}>
                <View style={styles.paymentRow}>
                  <View style={styles.paymentMethod}>
                    <Ionicons name="cash" size={16} color="#4CAF50" />
                    <Text style={styles.paymentText}>Tunai</Text>
                  </View>
                  <Text style={styles.paymentAmount}>
                    {formatRupiah(setoran.cash)}
                  </Text>
                </View>

                <View style={styles.paymentRow}>
                  <View style={styles.paymentMethod}>
                    <Ionicons name="phone-portrait" size={16} color="#2196F3" />
                    <Text style={styles.paymentText}>QRIS</Text>
                  </View>
                  <Text style={styles.paymentAmount}>
                    {formatRupiah(setoran.qris)}
                  </Text>
                </View>

                <View style={styles.paymentRow}>
                  <View style={styles.paymentMethod}>
                    <Ionicons name="swap-horizontal" size={16} color="#FF9800" />
                    <Text style={styles.paymentText}>Transfer</Text>
                  </View>
                  <Text style={styles.paymentAmount}>
                    {formatRupiah(setoran.transfer)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

// Styles tetap sama seperti sebelumnya
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
  warningText: {
    textAlign: 'center',
    color: '#FF9800',
    marginTop: 8,
    fontSize: 12,
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
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  indexButton: {
    backgroundColor: '#4CAF50',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  periodContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  fallbackInfo: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 4,
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
  cashCard: {
    backgroundColor: '#E8F5E9',
  },
  qrisCard: {
    backgroundColor: '#E3F2FD',
    marginHorizontal: 8,
  },
  transferCard: {
    backgroundColor: '#FFF3E0',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  totalContainer: {
    backgroundColor: '#007AFF',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  totalLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  totalValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  totalCount: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
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
  setoranCount: {
    color: '#666',
    fontSize: 14,
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
  emptySubtext: {
    textAlign: 'center',
    color: '#999',
    marginTop: 8,
    fontSize: 14,
  },
  setoranCard: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mismatchedCard: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
  },
  setoranHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  setoranDate: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
  },
  setoranTime: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  setoranTotalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setoranTotal: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
    marginRight: 4,
  },
  setoranDetails: {
    gap: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#333',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  kasirRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  kasirLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 6,
  },
  kasirValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  catatanRow: {
    marginTop: 4,
  },
  catatanLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  catatanValue: {
    fontSize: 12,
    color: '#333',
    fontStyle: 'italic',
  },
  mismatchWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFCDD2',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  mismatchText: {
    color: '#D32F2F',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  helpSection: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginTop: 8,
    marginBottom: 8,
  },
  helpText: {
    textAlign: 'center',
    color: '#1976D2',
    marginBottom: 16,
  },
  helpButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  helpButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default LaporanSetoranScreen;