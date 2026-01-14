export interface Produk {
  id: string;
  nama: string;
  barcode: string;
  harga_beli: number;
  harga_jual1: number;
  harga_jual2: number;
  harga_jual3: number;
  harga_jual4: number;
  stok: number; // Stok langsung, tidak perlu details
  kategori: string;
  updatedAt: number;
}

// Hapus interface ProdukDetail karena tidak digunakan lagi