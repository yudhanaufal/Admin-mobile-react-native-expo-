
export interface Penjualan {
  id: string;
  storeId: string;
  tanggal: Date;
  kasir: string;
  metodePembayaran: 'tunai' | 'qris' | 'transfer';
  total: number;
  laba: number;
  items: ItemPenjualan[];
  return: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemPenjualan {
  id: string;
  nama: string;
  harga: number;
  hargaBeli: number;
  quantity: number;
  subtotal: number;
  laba: number;
}

export interface LaporanData {
  omsetKeseluruhan: number;
  omsetTunai: number;
  omsetQris: number;
  omsetTransfer: number;
  labaKeseluruhan: number;
  penjualan: Penjualan[];
  totalTransaksi: number;
  rataRataTransaksi: number;
}

export interface Store {
  id: string;
  nama: string;
  alamat: string;
}