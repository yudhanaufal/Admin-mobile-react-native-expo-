// types/models.ts
export interface ItemOperasional {
  amount: number;
  description: string;
  type: string;
}

export interface Operasional {
  id: string;
  storeId: string;
  tanggal: Date;
  total: number;
  items: ItemOperasional[];
  createdAt: Date;
  catatan?: string;
  kasir?: string;
}

export interface LaporanOperasionalData {
  totalPengeluaran: number;
  operasional: Operasional[];
  jumlahTransaksi: number;
  rataRataPengeluaran: number;
  breakdownByType: { [key: string]: number };
}