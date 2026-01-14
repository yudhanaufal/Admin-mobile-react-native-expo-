// services/pembelianService.ts
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Pembelian } from '../models/Pembelian';

export const createPembelian = async (pembelian: Omit<Pembelian, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, `stores/${pembelian.storeId}/purchases`), {
    ...pembelian,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  return docRef.id;
};

export const updatePembelianStatus = async (
  storeId: string,
  pembelianId: string,
  status: 'confirmed' | 'rejected',
  userId: string
): Promise<void> => {
  await updateDoc(doc(db, `stores/${storeId}/purchases/${pembelianId}`), {
    status,
    confirmedBy: userId,
    updatedAt: Date.now()
  });
};