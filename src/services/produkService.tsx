import { Produk } from '../models/Produk';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';
import { Alert } from 'react-native';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

export const produkService = {
  // Listen untuk perubahan data realtime
  async listenToProduk(tokoId: string, callback: (produkList: Produk[]) => void): Promise<() => void> {
    if (!tokoId) {
      console.error('Toko ID tidak valid');
      return () => {};
    }

    try {
      const coll = collection(db, "stores", tokoId, "produks");
      const q = query(coll, orderBy('updatedAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const produkList: Produk[] = [];
          snapshot.forEach((doc) => {
            const produk = doc.data() as Produk;
            produkList.push(produk);
          });
          callback(produkList);
        },
        (error) => {
          console.error('Error listening to produk:', error);
          Alert.alert('Error', 'Gagal memuat data produk');
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up listener:', error);
      return () => {};
    }
  },

  // Ambil semua produk (tanpa realtime)
  async getAll(tokoId: string): Promise<Produk[]> {
    try {
      const coll = collection(db, "stores", tokoId, "produks");
      const q = query(coll, orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q);
      
      return snap.docs.map((d) => d.data() as Produk);
    } catch (error) {
      console.error('Error getting products:', error);
      throw new Error('Gagal mengambil data produk');
    }
  },

  // Buat produk baru
  async create(tokoId: string, payload: Omit<Produk, 'id' | 'updatedAt'>): Promise<Produk> {
    try {
      const item: Produk = { 
        ...payload, 
        id: uuidv4(), 
        updatedAt: Date.now() 
      };

      const coll = collection(db, 'stores', tokoId, 'produks');
      const d = doc(coll, item.id);
      await setDoc(d, item);

      return item;
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error('Gagal membuat produk');
    }
  },

  // Buat banyak produk sekaligus (untuk import)
  async batchCreate(tokoId: string, products: Omit<Produk, 'id' | 'updatedAt'>[]): Promise<Produk[]> {
    try {
      const createdProducts: Produk[] = [];
      
      for (const payload of products) {
        const item: Produk = { 
          ...payload, 
          id: uuidv4(), 
          updatedAt: Date.now() 
        };
        
        createdProducts.push(item);
        
        // Simpan ke Firestore
        const coll = collection(db, 'stores', tokoId, 'produks');
        const d = doc(coll, item.id);
        await setDoc(d, item);
      }
      
      return createdProducts;
    } catch (error) {
      console.error('Error batch creating products:', error);
      throw new Error('Gagal mengimpor produk');
    }
  },

  // Update produk
  async update(tokoId: string, id: string, changes: Partial<Omit<Produk, 'id'>>): Promise<Produk> {
    try {
      const coll = collection(db, 'stores', tokoId, 'produks');
      const d = doc(coll, id);
      
      const updateData = {
        ...changes,
        updatedAt: Date.now()
      };
      
      await updateDoc(d, updateData);
      
      // Ambil data terbaru
      const updatedDoc = await getDocs(query(coll, where('id', '==', id)));
      if (updatedDoc.empty) {
        throw new Error('Produk tidak ditemukan setelah update');
      }
      
      return updatedDoc.docs[0].data() as Produk;
    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error('Gagal mengupdate produk');
    }
  },

  // Hapus produk
  async remove(tokoId: string, id: string): Promise<boolean> {
    try {
      const coll = collection(db, 'stores', tokoId, 'produks');
      const d = doc(coll, id);
      await deleteDoc(d);
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error('Gagal menghapus produk');
    }
  },

  // Update stok produk
  async updateStok(tokoId: string, id: string, newStok: number): Promise<Produk> {
    try {
      const coll = collection(db, 'stores', tokoId, 'produks');
      const d = doc(coll, id);
      
      await updateDoc(d, {
        stok: newStok,
        updatedAt: Date.now()
      });
      
      // Ambil data terbaru
      const updatedDoc = await getDocs(query(coll, where('id', '==', id)));
      if (updatedDoc.empty) {
        throw new Error('Produk tidak ditemukan setelah update stok');
      }
      
      return updatedDoc.docs[0].data() as Produk;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw new Error('Gagal mengupdate stok produk');
    }
  }
};

export { Produk };
