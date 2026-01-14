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
import { Setoran, LaporanSetoranData } from '../models/LaporanSetoran';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class SetoranService {
  static async getLaporanSetoranPeriode(startDate: Date, endDate: Date): Promise<LaporanSetoranData> {
    try {
      const selectedTokoId = await AsyncStorage.getItem('@pos:selectedTokoId');
      
      if (!selectedTokoId) {
        throw new Error('Toko belum dipilih');
      }


      // Query dengan path yang benar: stores/{tokoId}/setoran
      const setoranRef = collection(db, "stores", selectedTokoId, "setoran");
      const q = query(
        setoranRef,
        orderBy('tanggal', 'desc'),
        limit(1000)
      );

      const querySnapshot = await getDocs(q);
      
      let totalCash = 0;
      let totalQris = 0;
      let totalTransfer = 0;
      let totalKeseluruhan = 0;
      const setoran: Setoran[] = [];

      // Convert dates to timestamps for comparison
      const startTime = startDate.getTime();
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      const endTime = endOfDay.getTime();

      // Process each document
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Convert tanggal dari Firestore Timestamp ke Date
        let setoranDate: Date;
        if (data.tanggal && typeof data.tanggal.toDate === 'function') {
          setoranDate = data.tanggal.toDate();
        } else if (data.tanggal) {
          setoranDate = new Date(data.tanggal);
        } else {
          setoranDate = new Date();
        }

        const setoranTime = setoranDate.getTime();

        // Filter by date range
        if (setoranTime >= startTime && setoranTime <= endTime) {
          const setoranData: Setoran = {
            id: doc.id,
            storeId: selectedTokoId,
            tanggal: setoranDate,
            cash: Number(data.cash || 0),
            qris: Number(data.qris || 0),
            transfer: Number(data.transfer || 0),
            total: Number(data.total || 0),
            createdAt: data.createdAt ? new Date(data.createdAt) : setoranDate,
            catatan: data.catatan,
            kasir: data.kasir || 'Unknown'
          };

          setoran.push(setoranData);

          totalCash += setoranData.cash;
          totalQris += setoranData.qris;
          totalTransfer += setoranData.transfer;
          totalKeseluruhan += setoranData.total;
        }
      });


      const jumlahSetoran = setoran.length;
      const rataRataSetoran = jumlahSetoran > 0 ? totalKeseluruhan / jumlahSetoran : 0;

      return {
        totalCash,
        totalQris,
        totalTransfer,
        totalKeseluruhan,
        setoran,
        rataRataSetoran,
        jumlahSetoran
      };
    } catch (error) {
      console.error('Error fetching laporan setoran:', error);
      
      return {
        totalCash: 0,
        totalQris: 0,
        totalTransfer: 0,
        totalKeseluruhan: 0,
        setoran: [],
        rataRataSetoran: 0,
        jumlahSetoran: 0
      };
    }
  }

  // Method untuk membuat setoran baru
  static async createSetoran(setoranData: Omit<Setoran, 'id' | 'createdAt'>): Promise<string> {
    try {
      const selectedTokoId = await AsyncStorage.getItem('@pos:selectedTokoId');
      
      if (!selectedTokoId) {
        throw new Error('Toko belum dipilih');
      }

      const { addDoc, Timestamp } = await import('firebase/firestore');
      
      const docRef = await addDoc(collection(db, "stores", selectedTokoId, "setoran"), {
        cash: setoranData.cash,
        qris: setoranData.qris,
        transfer: setoranData.transfer,
        total: setoranData.cash + setoranData.qris + setoranData.transfer,
        tanggal: Timestamp.fromDate(setoranData.tanggal),
        createdAt: new Date().toISOString(),
        catatan: setoranData.catatan,
        kasir: setoranData.kasir,
        storeId: selectedTokoId
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating setoran:', error);
      throw error;
    }
  }
}