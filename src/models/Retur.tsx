// models/Retur.tsx
export interface ReturItem {
  id: string;
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
