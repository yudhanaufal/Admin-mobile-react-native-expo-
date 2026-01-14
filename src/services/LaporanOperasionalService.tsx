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
import { Operasional, LaporanOperasionalData, ItemOperasional } from '../models/LaporanOperasional';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class OperasionalService {
  static async getLaporanOperasionalPeriode(startDate: Date, endDate: Date): Promise<LaporanOperasionalData> {
    try {
      const selectedTokoId = await AsyncStorage.getItem('@pos:selectedTokoId');
      
      if (!selectedTokoId) {
        throw new Error('Toko belum dipilih');
      }


      // Query dengan path: stores/{tokoId}/operasional
      const operasionalRef = collection(db, "stores", selectedTokoId, "operasional");
      const q = query(
        operasionalRef,
        orderBy('tanggal', 'desc'),
        limit(1000)
      );

      const querySnapshot = await getDocs(q);
      
      let totalPengeluaran = 0;
      const operasional: Operasional[] = [];
      const breakdownByType: { [key: string]: number } = {};

      // Convert dates to timestamps for comparison
      const startTime = startDate.getTime();
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      const endTime = endOfDay.getTime();

      // Process each document
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Convert tanggal dari Firestore Timestamp ke Date
        let operasionalDate: Date;
        if (data.tanggal && typeof data.tanggal.toDate === 'function') {
          operasionalDate = data.tanggal.toDate();
        } else if (data.tanggal && typeof data.tanggal === 'string') {
          // Handle format "August 21, 2025 at 11:12:10 PM UTC+7"
          try {
            const fixedDateStr = data.tanggal
              .replace(' at ', ' ')
              .replace(' UTC+7', ' GMT+0700');
            operasionalDate = new Date(fixedDateStr);
          } catch {
            operasionalDate = new Date();
          }
        } else if (data.createakt && typeof data.createakt === 'string') {
          // Handle format "2025-08-21116:12:45 7222"
          try {
            const fixedDateStr = data.createakt
              .replace('2025-08-211', '2025-08-21 ')
              .replace(' ', 'T')
              .substring(0, 19) + 'Z';
            operasionalDate = new Date(fixedDateStr);
          } catch {
            operasionalDate = new Date();
          }
        } else {
          operasionalDate = new Date();
        }

        const operasionalTime = operasionalDate.getTime();

        // Filter by date range
        if (operasionalTime >= startTime && operasionalTime <= endTime) {
          // Process items array
          const items: ItemOperasional[] = Array.isArray(data.items) 
            ? data.items.map((item: any) => ({
                amount: Number(item.amount || item.amount?.replace('$', '') || 0),
                description: item.description || '',
                type: item.type || ''
              }))
            : [];

          // Calculate total from items if not provided
          const calculatedTotal = items.reduce((sum, item) => sum + item.amount, 0);
          const total = data.total ? Number(data.total || data.total?.replace('$', '') || 0) : calculatedTotal;

          const operasionalData: Operasional = {
            id: doc.id,
            storeId: selectedTokoId,
            tanggal: operasionalDate,
            total: total,
            items: items,
            createdAt: data.createdAt ? new Date(data.createdAt) : operasionalDate,
            catatan: data.catatan,
            kasir: data.kasir || 'Unknown'
          };

          operasional.push(operasionalData);
          totalPengeluaran += total;

          // Add to breakdown by type
          items.forEach(item => {
            if (item.type) {
              breakdownByType[item.type] = (breakdownByType[item.type] || 0) + item.amount;
            }
          });
        }
      });

      const jumlahTransaksi = operasional.length;
      const rataRataPengeluaran = jumlahTransaksi > 0 ? totalPengeluaran / jumlahTransaksi : 0;

      return {
        totalPengeluaran,
        operasional,
        jumlahTransaksi,
        rataRataPengeluaran,
        breakdownByType
      };
    } catch (error) {
      console.error('Error fetching laporan operasional:', error);
      
      return {
        totalPengeluaran: 0,
        operasional: [],
        jumlahTransaksi: 0,
        rataRataPengeluaran: 0,
        breakdownByType: {}
      };
    }
  }

  // Method untuk membuat operasional baru
  static async createOperasional(operasionalData: Omit<Operasional, 'id' | 'createdAt'>): Promise<string> {
    try {
      const selectedTokoId = await AsyncStorage.getItem('@pos:selectedTokoId');
      
      if (!selectedTokoId) {
        throw new Error('Toko belum dipilih');
      }

      const { addDoc, Timestamp } = await import('firebase/firestore');
      
      const docRef = await addDoc(collection(db, "stores", selectedTokoId, "operasional"), {
        items: operasionalData.items,
        total: operasionalData.items.reduce((sum, item) => sum + item.amount, 0),
        tanggal: Timestamp.fromDate(operasionalData.tanggal),
        createdAt: new Date().toISOString(),
        catatan: operasionalData.catatan,
        kasir: operasionalData.kasir,
        storeId: selectedTokoId
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating operasional:', error);
      throw error;
    }
  }

  // Debug method untuk operasional
  static async debugOperasionalData(tokoId: string): Promise<any[]> {
    try {
      const operasionalRef = collection(db, "stores", tokoId, "operasional");
      const q = query(operasionalRef);
      
      const querySnapshot = await getDocs(q);
      const allData: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        allData.push({
          id: doc.id,
          ...data,
          tanggal: data.tanggal?.toDate?.() || data.tanggal,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          createakt: data.createakt
        });
      });
      

      return allData;
    } catch (error) {
      console.error('Error debugging operasional data:', error);
      return [];
    }
  }
}