import AsyncStorage from '@react-native-async-storage/async-storage';
import { Toko } from '../models/Toko';
import { v4 as uuidv4 } from 'uuid';
import { Alert } from 'react-native';
import { collection, doc, setDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const STORAGE_KEY = '@pos:toko:v1';
const FS_COLLECTION = 'stores';

interface TokoCreatePayload extends Omit<Toko, 'id' | 'updatedAt'> {}
interface TokoUpdatePayload extends Partial<Omit<Toko, 'id'>> {}

const readLocal = async (): Promise<Toko[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Error reading local stores:', error);
    return [];
  }
};

const writeLocal = async (list: Toko[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    console.error('Error writing local stores:', error);
    throw error;
  }
};

export const tokoService = {
  async getAll(): Promise<Toko[]> {
    try {
      // Try to get from Firestore first
      const firestoreData = await this.pullFromFirestore();
      if (firestoreData.length > 0) {
        return firestoreData;
      }
      
      // Fallback to local storage
      return await readLocal();
    } catch (error) {
      console.error('Error getting stores:', error);
      return await readLocal();
    }
  },

  async getById(id: string): Promise<Toko | null> {
    try {
      const stores = await this.getAll();
      return stores.find(store => store.id === id) || null;
    } catch (error) {
      console.error('Error getting store by ID:', error);
      return null;
    }
  },

  async create(payload: TokoCreatePayload): Promise<Toko> {
    const newStore: Toko = {
      ...payload,
      id: uuidv4(),
      updatedAt: Date.now(),
    };

    // Validate PIN if exists
    if (payload.pin && payload.pin.length !== 4) {
      throw new Error('PIN must be 4 digits');
    }

    try {
      // Save to Firestore
      await setDoc(doc(db, FS_COLLECTION, newStore.id), newStore);
      
      // Save to local storage
      const localStores = await readLocal();
      localStores.unshift(newStore);
      await writeLocal(localStores);

      return newStore;
    } catch (error) {
      console.error('Error creating store:', error);
      throw new Error('Failed to create store');
    }
  },

  async update(id: string, changes: TokoUpdatePayload): Promise<Toko> {
    // Validate PIN if exists
    if (changes.pin && changes.pin.length !== 4) {
      throw new Error('PIN must be 4 digits');
    }

    try {
      const localStores = await readLocal();
      const index = localStores.findIndex(store => store.id === id);
      
      if (index === -1) {
        throw new Error('Store not found');
      }

      const updatedStore = {
        ...localStores[index],
        ...changes,
        updatedAt: Date.now(),
      };

      // Update Firestore
      await updateDoc(doc(db, FS_COLLECTION, id), updatedStore);

      // Update local storage
      localStores[index] = updatedStore;
      await writeLocal(localStores);

      return updatedStore;
    } catch (error) {
      console.error('Error updating store:', error);
      throw new Error('Failed to update store');
    }
  },

  async remove(id: string): Promise<void> {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, FS_COLLECTION, id));

      // Delete from local storage
      const localStores = await readLocal();
      const updatedStores = localStores.filter(store => store.id !== id);
      await writeLocal(updatedStores);
    } catch (error) {
      console.error('Error deleting store:', error);
      throw new Error('Failed to delete store');
    }
  },

  async syncToFirestore(): Promise<void> {
    try {
      const localStores = await readLocal();
      const batch = [];

      for (const store of localStores) {
        batch.push(setDoc(doc(db, FS_COLLECTION, store.id), {
          id: store.id,
          nama: store.nama,
          alamat: store.alamat,
          no_tlp: store.no_tlp,
          pin: store.pin || null,
          updatedAt: store.updatedAt,
        }));
      }

      await Promise.all(batch);
    } catch (error) {
      console.error('Error syncing to Firestore:', error);
      throw new Error('Failed to sync stores to server');
    }
  },

  async pullFromFirestore(): Promise<Toko[]> {
    try {
      const querySnapshot = await getDocs(collection(db, FS_COLLECTION));
      const stores: Toko[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data();
        stores.push({
          id: doc.id,
          nama: data.nama,
          alamat: data.alamat,
          no_tlp: data.no_tlp,
          pin: data.pin || '',
          updatedAt: data.updatedAt || Date.now(),
        });
      });

      // Update local storage with fresh data
      if (stores.length > 0) {
        await writeLocal(stores);
      }

      return stores;
    } catch (error) {
      console.error('Error pulling from Firestore:', error);
      throw new Error('Failed to fetch stores from server');
    }
  },

  async verifyPin(tokoId: string, pin: string): Promise<boolean> {
    try {
      const store = await this.getById(tokoId);
      if (!store) return false;
      
      // If store doesn't have PIN, consider it verified
      if (!store.pin) return true;
      
      return store.pin === pin;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  },
};