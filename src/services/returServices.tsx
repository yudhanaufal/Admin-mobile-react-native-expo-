import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, getDoc, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/firebase";

export interface ReturItem {
  id_produk: string;
  nama: string;
  harga_beli: number;
  jumlah_retur: number;
  subtotal: number;
}

export interface Retur {
  id: string;
  tanggal: string;
  total_retur: number;
  items?: ReturItem[];
}

export const returService = {
  /** Ambil semua retur dari subcollection toko */
  async getAllByStore(storeId: string): Promise<Retur[]> {
    try {
      const q = query(
        collection(db, `stores/${storeId}/retur`),
        orderBy("tanggal", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          tanggal: d.tanggal,
          total_retur: d.total_retur,
          items: undefined, // items diambil terpisah
        };
      });
    } catch (e) {
      console.error("Gagal ambil data retur dari toko:", e);
      return [];
    }
  },

  /** Ambil satu retur berdasarkan ID dan storeId */
  async getById(storeId: string, returId: string): Promise<Retur | null> {
    try {
      const returDoc = await getDoc(doc(db, `stores/${storeId}/retur/${returId}`));
      if (!returDoc.exists()) return null;
      const d = returDoc.data();
      // Ambil items dari subcollection
      const itemsSnap = await getDocs(collection(db, `stores/${storeId}/retur/${returId}/items`));
      const items = itemsSnap.docs.map((item) => ({
        id_produk: item.data().id_produk,
        nama: item.data().nama,
        harga_beli: item.data().harga_beli,
        jumlah_retur: item.data().jumlah_retur,
        subtotal: item.data().subtotal,
      }));
      return {
        id: returId,
        tanggal: d.tanggal,
        total_retur: d.total_retur,
        items,
      };
    } catch (e) {
      console.error("Gagal ambil retur:", e);
      return null;
    }
  },

  /** Buat retur baru di toko */
  async create(storeId: string, data: Omit<Retur, "id">): Promise<string | null> {
    try {
      const returRef = await addDoc(collection(db, `stores/${storeId}/retur`), {
        tanggal: data.tanggal,
        total_retur: data.total_retur,
      });
      // Simpan items ke subcollection
      for (const item of data.items || []) {
        const itemRef = doc(collection(db, `stores/${storeId}/retur/${returRef.id}/items`));
        await setDoc(itemRef, item);
      }
      return returRef.id;
    } catch (e) {
      console.error("Gagal membuat retur:", e);
      return null;
    }
  },

  /** Update retur di toko */
  async update(storeId: string, returId: string, data: Partial<Retur>): Promise<boolean> {
    try {
      const returRef = doc(db, `stores/${storeId}/retur/${returId}`);
      await updateDoc(returRef, data);
      // Jika ada items, update subcollection
      if (data.items) {
        for (const item of data.items) {
          const itemRef = doc(collection(db, `stores/${storeId}/retur/${returId}/items`));
          await setDoc(itemRef, item);
        }
      }
      return true;
    } catch (e) {
      console.error("Gagal update retur:", e);
      return false;
    }
  },

  /** Hapus retur di toko */
  async delete(storeId: string, returId: string): Promise<boolean> {
    try {
      const returRef = doc(db, `stores/${storeId}/retur/${returId}`);
      await deleteDoc(returRef);
      // Hapus semua items di subcollection
      const itemsSnap = await getDocs(collection(db, `stores/${storeId}/retur/${returId}/items`));
      for (const item of itemsSnap.docs) {
        await deleteDoc(item.ref);
      }
      return true;
    } catch (e) {
      console.error("Gagal hapus retur:", e);
      return false;
    }
  },
};