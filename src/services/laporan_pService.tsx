// services/firestoreService.ts
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Penjualan, LaporanData } from '../models/laporan_p';
import AsyncStorage from '@react-native-async-storage/async-storage';


export class LaporanService {
  static async getLaporanPeriode(startDate: Date, endDate: Date): Promise<LaporanData> {
    try {
      const selectedTokoId = await AsyncStorage.getItem('@pos:selectedTokoId');
      if (!selectedTokoId) throw new Error('Toko belum dipilih');

      const startTime = startDate.getTime();
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      const endTime = endOfDay.getTime();

      const transaksiRef = collection(db, 'stores', selectedTokoId, 'transaksi');
      const q = query(transaksiRef);
      const querySnapshot = await getDocs(q);
     

      let omsetKeseluruhan = 0;
      let omsetTunai = 0;
      let omsetQris = 0;
      let omsetTransfer = 0;
      let labaKeseluruhan = 0;
      const penjualan: Penjualan[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const transactionDate = typeof data.waktu === 'string'
        ? new Date(Date.parse(data.waktu.replace(' at ', ' ').replace(' ', ' ')))
        : data.waktu?.toDate ? data.waktu.toDate() : new Date(data.waktu);
        const transactionTime = transactionDate.getTime();
        if (transactionTime >= startTime && transactionTime <= endTime) {
          const penjualanData: Penjualan = {
            id: doc.id,
            storeId: selectedTokoId,
            tanggal: transactionDate,
            kasir: data.kasir || 'Unknown',
            metodePembayaran: data.metode || 'tunai',
            total: data.total || 0,
            laba: Array.isArray(data.items) ? data.items.reduce((sum, item) => sum + (item.laba || 0), 0) : 0,
            items: data.items || [],
            return: false,
            createdAt: transactionDate,
            updatedAt: transactionDate
          };
          penjualan.push(penjualanData);
          omsetKeseluruhan += penjualanData.total;
          labaKeseluruhan += penjualanData.laba;
          switch ((penjualanData.metodePembayaran || '').toLowerCase()) {
            case 'tunai':
              omsetTunai += penjualanData.total;
              break;
            case 'qris':
              omsetQris += penjualanData.total;
              break;
            case 'transfer':
              omsetTransfer += penjualanData.total;
              break;
          }
        }
      });
    
      const totalTransaksi = penjualan.length;
      const rataRataTransaksi = totalTransaksi > 0 ? omsetKeseluruhan / totalTransaksi : 0;
      return {
        omsetKeseluruhan,
        omsetTunai,
        omsetQris,
        omsetTransfer,
        labaKeseluruhan,
        penjualan,
        totalTransaksi,
        rataRataTransaksi
      };
    } catch (error) {
      console.error('Error fetching laporan periode:', error);
      throw error;
    }
  }
  // Metode alternatif jika data sangat banyak
static async getLaporanPeriodeAlternative(startDate: Date, endDate: Date): Promise<LaporanData> {
    try {
      const selectedTokoId = await AsyncStorage.getItem('@pos:selectedTokoId');
      
      if (!selectedTokoId) {
        throw new Error('Toko belum dipilih');
      }



      // APPROACH 2: Pagination untuk data besar
      let allPenjualan: Penjualan[] = [];
      let lastDoc = null;
      let hasMore = true;
      const pageSize = 100;

      const startTime = startDate.getTime();
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      const endTime = endOfDay.getTime();

      while (hasMore) {
        const penjualanRef = collection(db, 'penjualan');
        let q = query(
          penjualanRef,
          where('storeId', '==', selectedTokoId),
          orderBy('tanggal', 'desc'),
          limit(pageSize)
        );

        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          hasMore = false;
          break;
        }

        let foundInPeriod = false;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const transactionDate = data.tanggal?.toDate?.() || new Date();
          const transactionTime = transactionDate.getTime();

          if (transactionTime >= startTime && transactionTime <= endTime) {
            foundInPeriod = true;
            const penjualanData: Penjualan = {
              id: doc.id,
              storeId: data.storeId,
              tanggal: transactionDate,
              kasir: data.kasir || 'Unknown',
              metodePembayaran: data.metodePembayaran || 'tunai',
              total: data.total || 0,
              laba: data.laba || 0,
              items: data.items || [],
              return: data.return || false,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date()
            };
            allPenjualan.push(penjualanData);
          }
        });

        // Jika tidak ada data dalam periode ini, stop
        if (!foundInPeriod) {
          hasMore = false;
        }

        lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      }

      // Hitung totals
      const totals = allPenjualan.reduce((acc, transaction) => {
        acc.omsetKeseluruhan += transaction.total;
        acc.labaKeseluruhan += transaction.laba;

        switch (transaction.metodePembayaran) {
          case 'tunai':
            acc.omsetTunai += transaction.total;
            break;
          case 'qris':
            acc.omsetQris += transaction.total;
            break;
          case 'transfer':
            acc.omsetTransfer += transaction.total;
            break;
        }

        return acc;
      }, {
        omsetKeseluruhan: 0,
        omsetTunai: 0,
        omsetQris: 0,
        omsetTransfer: 0,
        labaKeseluruhan: 0
      });

      const totalTransaksi = allPenjualan.length;
      const rataRataTransaksi = totalTransaksi > 0 ? totals.omsetKeseluruhan / totalTransaksi : 0;

      return {
        ...totals,
        penjualan: allPenjualan,
        totalTransaksi,
        rataRataTransaksi
      };
    } catch (error) {
      console.error('Error fetching laporan periode (paginated):', error);
      throw error;
    }
  }
}