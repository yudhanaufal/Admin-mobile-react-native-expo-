// screens/LaporanScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Platform 
} from 'react-native';
import { LaporanService } from '../services/laporan_pService';
import { LaporanData } from '../models/laporan_p';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const Laporan_p = () => {
  const [laporan, setLaporan] = useState<LaporanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [usingAlternativeMethod, setUsingAlternativeMethod] = useState(false);

  useEffect(() => {
    // Set default to today
    const today = new Date();
    setStartDate(today);
    setEndDate(today);
    loadLaporan(today, today);
  }, []);

  const loadLaporan = async (start: Date, end: Date) => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      try {
        // Try the main method first
        data = await LaporanService.getLaporanPeriode(start, end);
        setUsingAlternativeMethod(false);
      } catch (mainError) {
        console.warn('Main method failed, trying alternative:', mainError);
        // If main method fails, try alternative
        data = await LaporanService.getLaporanPeriodeAlternative(start, end);
        setUsingAlternativeMethod(true);
        
        Alert.alert(
          "Info", 
          "Menggunakan metode alternatif. Untuk performa lebih baik, buat index di Firebase Console."
        );
      }
      
      setLaporan(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat laporan');
      console.error('Error loading laporan:', err);
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

  const formatShortDate = (date: Date): string => {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatMetodePembayaran = (metode: string) => {
    switch (metode) {
      case 'tunai': return 'Tunai';
      case 'qris': return 'QRIS';
      case 'transfer': return 'Transfer';
      default: return metode;
    }
  };

  const handleFilter = () => {
    loadLaporan(startDate, endDate);
  };

  const handleResetFilter = () => {
    const today = new Date();
    setStartDate(today);
    setEndDate(today);
    loadLaporan(today, today);
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      // If iOS, we need to manually apply the filter
      if (Platform.OS === 'ios') {
        handleFilter();
      }
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
      // If iOS, we need to manually apply the filter
      if (Platform.OS === 'ios') {
        handleFilter();
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Memuat laporan...</Text>
        {usingAlternativeMethod && (
          <Text style={styles.infoText}>Menggunakan metode alternatif</Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Laporan Penjualan</Text>
        {usingAlternativeMethod && (
          <Text style={styles.warningText}>
            ⚠️ Mode alternatif - Buat index untuk performa lebih baik
          </Text>
        )}
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

        {Platform.OS === 'android' && (
          <View style={styles.filterButtons}>
            <TouchableOpacity 
              style={[styles.filterButton, styles.resetButton]}
              onPress={handleResetFilter}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterButton, styles.applyButton]}
              onPress={handleFilter}
            >
              <Text style={styles.applyButtonText}>Terapkan Filter</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onStartDateChange}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onEndDateChange}
          />
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={24} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadLaporan(startDate, endDate)} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Coba Lagi</Text>
          </TouchableOpacity>
          <Text style={styles.helpText}>
            Pastikan index sudah dibuat di Firebase Console
          </Text>
        </View>
      )}

      {/* Periode Text */}
      <View style={styles.periodContainer}>
        <Text style={styles.periodText}>
          Periode: {formatDate(startDate)} {startDate.getTime() !== endDate.getTime() ? `- ${formatDate(endDate)}` : ''}
        </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="cash" size={24} color="#007AFF" />
          <Text style={styles.summaryLabel}>Omset Total</Text>
          <Text style={styles.summaryValue}>
            {formatRupiah(laporan?.omsetKeseluruhan || 0)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="trending-up" size={24} color="#4CAF50" />
          <Text style={styles.summaryLabel}>Laba Bersih</Text>
          <Text style={[styles.summaryValue, styles.profitText]}>
            {formatRupiah(laporan?.labaKeseluruhan || 0)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="receipt" size={24} color="#FF9800" />
          <Text style={styles.summaryLabel}>Total Transaksi</Text>
          <Text style={styles.summaryValue}>
            {laporan?.totalTransaksi || 0}
          </Text>
        </View>
      </View>

      {/* Payment Methods Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
        
        <View style={styles.paymentRow}>
          <View style={styles.paymentMethod}>
            <Ionicons name="cash" size={20} color="#4CAF50" />
            <Text style={styles.paymentText}>Tunai</Text>
          </View>
          <Text style={styles.paymentAmount}>
            {formatRupiah(laporan?.omsetTunai || 0)}
          </Text>
        </View>

        <View style={styles.paymentRow}>
          <View style={styles.paymentMethod}>
            <Ionicons name="phone-portrait" size={20} color="#2196F3" />
            <Text style={styles.paymentText}>QRIS</Text>
          </View>
          <Text style={styles.paymentAmount}>
            {formatRupiah(laporan?.omsetQris || 0)}
          </Text>
        </View>

        <View style={styles.paymentRow}>
          <View style={styles.paymentMethod}>
            <Ionicons name="swap-horizontal" size={20} color="#FF9800" />
            <Text style={styles.paymentText}>Transfer</Text>
          </View>
          <Text style={styles.paymentAmount}>
            {formatRupiah(laporan?.omsetTransfer || 0)}
          </Text>
        </View>
      </View>

      {/* Transaction List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daftar Transaksi</Text>
          <Text style={styles.transactionCount}>({laporan?.penjualan.length || 0})</Text>
        </View>
        
        {laporan?.penjualan.length === 0 ? (
          <Text style={styles.emptyText}>Tidak ada transaksi pada periode ini</Text>
        ) : (
          laporan?.penjualan.map((transaction) => (
            <TouchableOpacity 
              key={transaction.id} 
              style={[
                styles.transactionCard,
                transaction.return && styles.returnTransactionCard
              ]}
            >
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionId}>
                  #{transaction.id.slice(-6)}
                </Text>
                <Text style={styles.transactionTime}>
                  {transaction.tanggal.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>

              <View style={styles.transactionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Kasir:</Text>
                  <Text style={styles.detailValue}>{transaction.kasir}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Metode:</Text>
                  <Text style={styles.detailValue}>
                    {formatMetodePembayaran(transaction.metodePembayaran)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total:</Text>
                  <Text style={styles.detailValue}>
                    {formatRupiah(transaction.total)}
                  </Text>
                </View>

                {transaction.return && (
                  <View style={styles.returnBadge}>
                    <Ionicons name="return-up-back" size={14} color="#FF3B30" />
                    <Text style={styles.returnText}>Return</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  infoText: {
    marginTop: 5,
    color: '#FF9800',
    fontSize: 12,
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
  helpText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
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
  profitText: {
    color: '#4CAF50',
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
  transactionCount: {
    color: '#666',
    fontSize: 14,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  transactionCard: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  returnTransactionCard: {
    backgroundColor: '#FFF9F9',
    borderColor: '#FFCDD2',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionId: {
    fontWeight: 'bold',
    color: '#333',
  },
  transactionTime: {
    color: '#666',
    fontSize: 12,
  },
  transactionDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: '#666',
  },
  detailValue: {
    color: '#333',
    fontWeight: '500',
  },
  returnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  returnText: {
    color: '#FF3B30',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default Laporan_p;