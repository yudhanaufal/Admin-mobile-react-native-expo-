// models/Pembelian.ts
export type ItemPembelian = {
  productId: string;
  nama: string;
  barcode: string;
  harga_beli: number;
  qtyDipesan: number;
  qtyDiterima?: number;
  subtotal: number;
};

export type Pembelian = {
  id?: string;
  storeId: string;
  items: ItemPembelian[];
  total: number;
  status: 'draft' | 'pending' | 'confirmed' | 'rejected';
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  confirmedBy?: string;
};