// types/models.ts
export interface Setoran {
  id: string;
  storeId: string;
  tanggal: Date;
  cash: number;
  qris: number;
  transfer: number;
  total: number;
  createdAt: Date;
  updatedAt?: Date;
  catatan?: string;
  kasir?: string;
}

export interface LaporanSetoranData {
  totalCash: number;
  totalQris: number;
  totalTransfer: number;
  totalKeseluruhan: number;
  setoran: Setoran[];
  rataRataSetoran: number;
  jumlahSetoran: number;
}